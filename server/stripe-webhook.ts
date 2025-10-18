import Stripe from 'stripe';
import { config } from './config';
import { recordCreditTransaction, updateUserCredits, getUser } from './db';
import { sendEmail, paymentConfirmationTemplate } from './email.service';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  try {
    if (!config.stripe.webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return null;
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    );

    return event;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  console.log(`[Stripe Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    throw error;
  }
}

/**
 * Handle successful charge
 */
async function handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
  const userId = charge.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Charge succeeded but no userId in metadata');
    return;
  }

  try {
    const credits = Math.floor((charge.amount / 100) * 10); // 10 credits per dollar
    await updateUserCredits(userId, credits);
    await recordCreditTransaction(userId, credits, 'purchase', charge.id);

    const user = await getUser(userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Payment Confirmed - Routix',
        html: paymentConfirmationTemplate(
          user.name || 'User',
          charge.amount,
          'Credit Purchase'
        ),
      });
    }

    console.log(`✅ Charge succeeded for user ${userId}: ${charge.amount / 100} USD`);
  } catch (error) {
    console.error('[Stripe] Error handling charge succeeded:', error);
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(charge: Stripe.Charge): Promise<void> {
  const userId = charge.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Charge failed but no userId in metadata');
    return;
  }

  try {
    await recordCreditTransaction(
      userId,
      0,
      'refund',
      charge.id
    );

    const user = await getUser(userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Payment Failed - Routix',
        html: `
          <h2>Payment Failed</h2>
          <p>Your payment of $${(charge.amount / 100).toFixed(2)} could not be processed.</p>
          <p>Please try again or contact support if the problem persists.</p>
        `,
      });
    }

    console.log(`❌ Charge failed for user ${userId}`);
  } catch (error) {
    console.error('[Stripe] Error handling charge failed:', error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Subscription created but no userId in metadata');
    return;
  }

  try {
    console.log(`✅ Subscription created for user ${userId}`);
    // Update user subscription status in database
  } catch (error) {
    console.error('[Stripe] Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Subscription updated but no userId in metadata');
    return;
  }

  try {
    console.log(`✅ Subscription updated for user ${userId}`);
    // Update user subscription status in database
  } catch (error) {
    console.error('[Stripe] Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Subscription deleted but no userId in metadata');
    return;
  }

  try {
    console.log(`✅ Subscription deleted for user ${userId}`);
    // Downgrade user to free plan
  } catch (error) {
    console.error('[Stripe] Error handling subscription deleted:', error);
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Invoice payment succeeded but no userId in metadata');
    return;
  }

  try {
    console.log(`✅ Invoice payment succeeded for user ${userId}`);
    // Add credits for subscription renewal
  } catch (error) {
    console.error('[Stripe] Error handling invoice payment succeeded:', error);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.warn('[Stripe] Invoice payment failed but no userId in metadata');
    return;
  }

  try {
    console.log(`❌ Invoice payment failed for user ${userId}`);
    // Send payment failure notification
  } catch (error) {
    console.error('[Stripe] Error handling invoice payment failed:', error);
  }
}

export default {
  verifyWebhookSignature,
  handleStripeWebhook,
};

