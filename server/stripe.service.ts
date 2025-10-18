import Stripe from 'stripe';
import { getDb } from './db';
import { creditTransactions, subscriptions, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: any;
}

/**
 * Create a checkout session for credit purchases
 */
export async function createCreditCheckoutSession(
  userId: string,
  packageId: string,
  credits: number,
  amount: number,
  userEmail: string
): Promise<StripeCheckoutSession> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for Routix thumbnail generation`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/billing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        packageId,
        credits: credits.toString(),
        type: 'credit_purchase',
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckoutSession(
  userId: string,
  planId: string,
  priceId: string,
  userEmail: string
): Promise<StripeCheckoutSession> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/billing?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/billing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        planId,
        type: 'subscription',
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    throw new Error('Failed to create subscription checkout session');
  }
}

/**
 * Retrieve checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error('Failed to retrieve checkout session');
  }
}

/**
 * Handle successful payment event
 */
export async function handlePaymentSuccess(event: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const session = event.data.object as any;
  const { userId, credits, type, planId } = session.metadata || {};

  if (type === 'credit_purchase' && credits) {
    // Update user credits
    const user = await (db as any).query.users.findFirst({ where: eq(users.id, userId) });
    const currentCredits = user?.credits || 0;
    
    await (db as any)
      .update(users)
      .set({
        credits: currentCredits + parseInt(credits),
      })
      .where(eq(users.id, userId));

    // Record transaction
    await (db as any).insert(creditTransactions).values({
      id: `txn_${Date.now()}`,
      userId,
      type: 'purchase',
      amount: parseInt(credits),
      description: `Credit purchase via Stripe (Session: ${session.id})`,
      stripeInvoiceId: session.id,
    });
  } else if (type === 'subscription' && planId) {
    // Update subscription status
    await (db as any)
      .update(subscriptions)
      .set({
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
        currentPeriodStart: new Date(session.created * 1000),
        currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000), // 30 days
      })
      .where(eq(subscriptions.userId, userId));
  }
}

/**
 * Handle subscription updated event
 */
export async function handleSubscriptionUpdated(event: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const subscription = event.data.object as any;
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  const status = subscription.status === 'active' ? 'active' : 'canceled';

  await (db as any)
    .update(subscriptions)
    .set({
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(subscriptions.userId, userId));
}

/**
 * Handle subscription deleted event
 */
export async function handleSubscriptionDeleted(event: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const subscription = event.data.object as any;
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  await (db as any)
    .update(subscriptions)
    .set({
      status: 'canceled',
      cancelAtPeriodEnd: true,
    })
    .where(eq(subscriptions.userId, userId));
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): StripeWebhookEvent | null {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return event as StripeWebhookEvent;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Get customer portal session for managing subscriptions
 */
export async function createCustomerPortalSession(
  customerId: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/billing`,
    });
    return session.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
}

/**
 * Create a customer in Stripe
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

/**
 * Retrieve customer details
 */
export async function getStripeCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw new Error('Failed to retrieve Stripe customer');
  }
}

/**
 * List all products (subscription plans)
 */
export async function listStripeProducts() {
  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
    return products.data;
  } catch (error) {
    console.error('Error listing Stripe products:', error);
    throw new Error('Failed to list Stripe products');
  }
}

/**
 * List all prices for a product
 */
export async function listStripePrices(productId: string) {
  try {
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });
    return prices.data;
  } catch (error) {
    console.error('Error listing Stripe prices:', error);
    throw new Error('Failed to list Stripe prices');
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number
): Promise<string> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount && { amount: Math.round(amount * 100) }), // Convert to cents
    });
    return refund.id;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw new Error('Failed to refund payment');
  }
}

/**
 * Cancel subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<void> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediate,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export default stripe;

