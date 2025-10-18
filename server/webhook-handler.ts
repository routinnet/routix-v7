import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, handleStripeWebhook } from './stripe-webhook';
import { captureException, addBreadcrumb } from './monitoring';

const router = Router();

/**
 * Stripe Webhook Endpoint
 * POST /api/webhooks/stripe
 * 
 * This endpoint receives webhook events from Stripe
 * and processes them accordingly.
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const body = req.body;

  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(JSON.stringify(body), signature);
    
    if (!event) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Add breadcrumb for debugging
    addBreadcrumb(`Stripe webhook received: ${event.type}`, { eventId: event.id });

    // Process the webhook event
    await handleStripeWebhook(event);

    // Return success response
    res.json({ received: true, eventId: event.id });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      webhook: 'stripe',
      signature: signature?.substring(0, 20) + '...',
    });

    // Return error response
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Health check endpoint
 * GET /api/webhooks/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;

