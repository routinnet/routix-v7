import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getUser,
  updateUserCredits,
  recordCreditTransaction,
} from "./db";
import { handleStripeWebhook } from "./webhooks";
import { createCreditCheckoutSession, createSubscriptionCheckoutSession, getCheckoutSession, cancelStripeSubscription, verifyWebhookSignature, handlePaymentSuccess, handleSubscriptionUpdated, handleSubscriptionDeleted } from "./stripe.service";

/**
 * Payment and Subscription Router
 * Handles Stripe integration, credit purchases, and subscription management
 */

// Credit packages
export const creditPackages = {
  starter: {
    id: "starter",
    credits: 100,
    price: 9.99,
    description: "100 credits",
  },
  pro: {
    id: "pro",
    credits: 500,
    price: 39.99,
    description: "500 credits",
  },
  enterprise: {
    id: "enterprise",
    credits: 2000,
    price: 129.99,
    description: "2000 credits",
  },
};

// Subscription plans
export const subscriptionPlans = {
  free: {
    id: "free",
    name: "Free",
    monthlyCredits: 50,
    price: 0,
    features: ["50 credits/month", "Basic templates", "Chat support"],
    stripePriceId: undefined,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCredits: 500,
    price: 19.99,
    features: ["500 credits/month", "All templates", "Priority support"],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyCredits: null, // Unlimited
    price: 99.99,
    features: ["Unlimited credits", "Custom templates", "Dedicated support"],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
};

export const paymentRouter = router({
  // Handle Stripe webhook
  handleWebhook: publicProcedure
    .input(z.object({
      body: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const event = verifyWebhookSignature(
          input.body,
          input.signature,
          process.env.STRIPE_WEBHOOK_SECRET || ""
        );

        if (!event) {
          throw new Error("Invalid webhook signature");
        }

        switch (event.type) {
          case "checkout.session.completed":
            await handlePaymentSuccess(event);
            break;
          case "customer.subscription.updated":
            await handleSubscriptionUpdated(event);
            break;
          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event);
            break;
        }

        return { success: true };
      } catch (error) {
        console.error("Webhook processing error:", error);
        return { success: false, error: "Webhook processing failed" };
      }
    }),

  // Get available credit packages
  getCreditPackages: publicProcedure.query(async () => {
    return Object.values(creditPackages);
  }),

  // Get subscription plans
  getSubscriptionPlans: publicProcedure.query(async () => {
    return Object.values(subscriptionPlans);
  }),

  // Create Stripe checkout session for credit purchase
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        packageId: z.enum(["starter", "pro", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      const creditPackage = creditPackages[input.packageId];
      if (!creditPackage) throw new Error("Invalid package");

      // Create Stripe checkout session
      const session = await createCreditCheckoutSession(
        ctx.user.id,
        input.packageId,
        creditPackage.credits,
        creditPackage.price,
        user.email || ""
      );

      return session;
    }),

  // Create Stripe checkout session for subscription
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["free", "pro", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      const plan = subscriptionPlans[input.planId as keyof typeof subscriptionPlans];
      if (!plan) throw new Error("Invalid plan");

      if (!plan.stripePriceId && input.planId !== 'free') {
        throw new Error("Subscription plan not configured for Stripe");
      }

      // Create Stripe subscription checkout session
      const session = await createSubscriptionCheckoutSession(
        ctx.user.id,
        input.planId,
        plan.stripePriceId || "",
        user.email || ""
      );

      return session;
    }),

  // Get checkout session details
  getCheckoutSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const session = await getCheckoutSession(input.sessionId);
        return {
          id: session.id,
          status: session.payment_status,
          amountTotal: session.amount_total ? session.amount_total / 100 : 0,
          metadata: session.metadata,
        };
      } catch (error) {
        throw new Error("Failed to retrieve checkout session");
      }
    }),

  // Handle successful payment (webhook)
  handlePaymentSuccess: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      try {
        const session = await getCheckoutSession(input.sessionId);
        
        if (session.payment_status !== "paid") {
          throw new Error("Payment not completed");
        }

        return {
          success: true,
          message: "Payment processed successfully",
        };
      } catch (error) {
        throw new Error("Failed to process payment");
      }
    }),

  // Get user's billing history
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: Implement billing history query from database
      // Return mock data for now
      return {
        transactions: [
          {
            id: "txn_1",
            date: new Date(),
            description: "Purchased 100 credits",
            amount: 9.99,
            type: "purchase",
            status: "completed",
          },
        ],
        total: 1,
      };
    }),

  // Get user's subscription status
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUser(ctx.user.id);
    if (!user) throw new Error("User not found");

    // TODO: Fetch actual subscription from Stripe
    return {
      planId: "free",
      planName: "Free",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      creditsRemaining: user.credits,
      monthlyCreditsAllowance: 50,
    };
  }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      try {
        await cancelStripeSubscription(input.subscriptionId);
        
        await recordCreditTransaction(
          ctx.user.id,
          0,
          "usage",
          "Subscription cancelled"
        );

        return { success: true };
      } catch (error) {
        throw new Error("Failed to cancel subscription");
      }
    }),

  // Update payment method
  updatePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Update payment method in Stripe
      // This would involve attaching the payment method to the customer
      return { success: true };
    }),

  // Get invoices
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: Fetch invoices from Stripe
      return {
        invoices: [
          {
            id: "inv_1",
            date: new Date(),
            amount: 9.99,
            status: "paid",
            description: "Monthly subscription",
            pdfUrl: "/invoices/inv_1.pdf",
          },
        ],
        total: 1,
      };
    }),

  // Download invoice
  downloadInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // TODO: Generate and return invoice PDF
      return {
        url: `/invoices/${input.invoiceId}.pdf`,
      };
    }),

  // Calculate tax
  calculateTax: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { calculateTax } = await import("./invoiceGenerator");
      return await calculateTax(ctx.user.id, input.amount);
    }),

  // Generate invoice
  generateInvoice: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
            total: z.number().positive(),
          })
        ),
        paymentMethod: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { generateInvoice } = await import("./invoiceGenerator");
      return await generateInvoice(ctx.user.id, input.items, input.paymentMethod);
    }),

  // Apply coupon code
  applyCoupon: protectedProcedure
    .input(z.object({ couponCode: z.string(), originalPrice: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { applyCoupon } = await import("./coupon.service");
      return await applyCoupon(input.couponCode, input.originalPrice);
    }),

  // Get referral link
  getReferralLink: protectedProcedure.query(async ({ ctx }) => {
    const { getReferralInfo } = await import("./referral.service");
    return await getReferralInfo(ctx.user.id);
  }),

  // Track referral when user signs up
  trackReferral: publicProcedure
    .input(z.object({ referredUserId: z.string(), referralCode: z.string() }))
    .mutation(async ({ input }) => {
      const { trackReferral } = await import("./referral.service");
      const success = await trackReferral(input.referredUserId, input.referralCode);
      return { success, message: success ? "Referral tracked" : "Failed to track referral" };
    }),

  // Get referral statistics
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const { getReferralStats } = await import("./referral.service");
    return await getReferralStats(ctx.user.id);
  }),

  // Validate coupon
  validateCoupon: publicProcedure
    .input(z.object({ couponCode: z.string() }))
    .query(async ({ input }) => {
      const { validateCoupon } = await import("./coupon.service");
      return await validateCoupon(input.couponCode);
    })
});

export type PaymentRouter = typeof paymentRouter;

