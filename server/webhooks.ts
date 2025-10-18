/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 */

import { z } from "zod";
import { updateUserCredits, recordCreditTransaction, getUser } from "./db";

// Stripe event types we care about
type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount?: number;
      currency?: string;
      customer?: string;
      metadata?: Record<string, string>;
      status?: string;
    };
  };
};

/**
 * Handle Stripe webhook events
 * This function should be called from your API endpoint that receives Stripe webhooks
 */
export async function handleStripeWebhook(event: StripeEvent): Promise<void> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "charge.succeeded":
        await handleChargeSucceeded(event);
        break;

      case "charge.failed":
        await handleChargeFailed(event);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
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
 * Add credits to user account
 */
async function handleChargeSucceeded(event: StripeEvent): Promise<void> {
  const charge = event.data.object;
  const userId = charge.metadata?.userId;

  if (!userId) {
    console.warn("[Stripe] Charge succeeded but no userId in metadata");
    return;
  }

  const user = await getUser(userId);
  if (!user) {
    console.warn(`[Stripe] User not found: ${userId}`);
    return;
  }

  // Determine credits based on amount
  const creditsToAdd = Math.floor((charge.amount || 0) / 100); // Convert cents to dollars

  // Get package info from metadata
  const packageId = charge.metadata?.packageId || "custom";
  const description = `Credit purchase - ${packageId} package`;

  // Update user credits
  const newBalance = user.credits + creditsToAdd;
  await updateUserCredits(userId, newBalance);

  // Record transaction
  await recordCreditTransaction(userId, creditsToAdd, "purchase", description);

  console.log(
    `[Stripe] Added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`
  );
}

/**
 * Handle failed charge
 * Log the failure
 */
async function handleChargeFailed(event: StripeEvent): Promise<void> {
  const charge = event.data.object;
  const userId = charge.metadata?.userId;

  console.warn(
    `[Stripe] Charge failed for user ${userId}: ${charge.id}`
  );

  // You could send an email notification here
  // or update a payment status in your database
}

/**
 * Handle subscription created
 * Update user subscription status
 */
async function handleSubscriptionCreated(event: StripeEvent): Promise<void> {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("[Stripe] Subscription created but no userId in metadata");
    return;
  }

  console.log(`[Stripe] Subscription created for user ${userId}`);

  try {
    // Update user subscription status in database
    // In production, this would update the user's subscription status
  } catch (error) {
    console.error('[Stripe] Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 * Update user subscription status
 */
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("[Stripe] Subscription updated but no userId in metadata");
    return;
  }

  console.log(`[Stripe] Subscription updated for user ${userId}`);

  try {
    // Update user subscription status in database
    // In production, this would update the user's subscription status
  } catch (error) {
    console.error('[Stripe] Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 * Downgrade user to free plan
 */
async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("[Stripe] Subscription deleted but no userId in metadata");
    return;
  }

  console.log(`[Stripe] Subscription deleted for user ${userId}`);

  try {
    // Downgrade user to free plan
    // In production, this would update the user's subscription status to free
  } catch (error) {
    console.error('[Stripe] Error handling subscription deleted:', error);
  }
}

/**
 * Handle invoice payment succeeded
 * Add credits for subscription renewal
 */
async function handleInvoicePaymentSucceeded(event: StripeEvent): Promise<void> {
  const invoice = event.data.object;
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.warn("[Stripe] Invoice payment succeeded but no userId in metadata");
    return;
  }

  const user = await getUser(userId);
  if (!user) {
    console.warn(`[Stripe] User not found: ${userId}`);
    return;
  }

  // Determine credits based on subscription plan
  // This is handled by your subscription plan configuration
  const planCredits = invoice.metadata?.monthlyCredits
    ? parseInt(invoice.metadata.monthlyCredits)
    : 50; // Default to free plan credits

  const newBalance = user.credits + planCredits;
  await updateUserCredits(userId, newBalance);

  await recordCreditTransaction(
    userId,
    planCredits,
    "purchase",
    "Monthly subscription renewal"
  );

  console.log(
    `[Stripe] Added ${planCredits} monthly credits to user ${userId}. New balance: ${newBalance}`
  );
}

/**
 * Handle invoice payment failed
 * Log the failure and potentially downgrade user
 */
async function handleInvoicePaymentFailed(event: StripeEvent): Promise<void> {
  const invoice = event.data.object;
  const userId = invoice.metadata?.userId;

  console.warn(
    `[Stripe] Invoice payment failed for user ${userId}: ${invoice.id}`
  );

  // You could send an email notification here
  // or update a payment status in your database
}

/**
 * Verify Stripe webhook signature
 * This should be called before processing the webhook
 */
export function verifyStripeWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // In a real implementation, use Stripe's webhook signing library
    // For now, this is a placeholder
    // const event = stripe.webhooks.constructEvent(body, signature, secret);
    // return true if valid, false otherwise
    return true;
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed:", error);
    return false;
  }
}

