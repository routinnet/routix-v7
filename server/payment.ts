import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getUser,
  updateUserCredits,
  recordCreditTransaction,
} from "./db";
import { handleStripeWebhook } from "./webhooks";

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
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCredits: 500,
    price: 9.99,
    features: ["500 credits/month", "All templates", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyCredits: null, // Unlimited
    price: 99.99,
    features: ["Unlimited credits", "Custom templates", "Dedicated support"],
  },
};

export const paymentRouter = router({
  // Handle Stripe webhook
  handleWebhook: publicProcedure
    .input(z.object({
      event: z.any(),
    }))
    .mutation(async ({ input }) => {
      try {
        await handleStripeWebhook(input.event);
        return { success: true };
      } catch (error) {
        console.error("Webhook processing error:", error);
        return { success: false, error: "Webhook processing failed" };
      }
    }),

  // Get available credit packages
  getCreditPackages: protectedProcedure.query(async () => {
    return Object.values(creditPackages);
  }),

  // Get subscription plans
  getSubscriptionPlans: protectedProcedure.query(async () => {
    return Object.values(subscriptionPlans);
  }),

  // Create Stripe checkout session for credit purchase
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        packageId: z.enum(["starter", "pro", "enterprise"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      const creditPackage = creditPackages[input.packageId];
      if (!creditPackage) throw new Error("Invalid package");

      // TODO: Integrate with Stripe API
      // For now, return mock session
      return {
        sessionId: `session_${Date.now()}`,
        url: `https://checkout.stripe.com/pay/session_${Date.now()}`,
      };
    }),

  // Create Stripe checkout session for subscription
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["free", "pro", "enterprise"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      const plan = subscriptionPlans[input.planId];
      if (!plan) throw new Error("Invalid plan");

      // TODO: Integrate with Stripe API
      // For now, return mock session
      return {
        sessionId: `sub_session_${Date.now()}`,
        url: `https://checkout.stripe.com/pay/sub_session_${Date.now()}`,
      };
    }),

  // Handle successful payment (webhook)
  handlePaymentSuccess: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        packageId: z.string().optional(),
        planId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.user.id);
      if (!user) throw new Error("User not found");

      // Handle credit package purchase
      if (input.packageId) {
        const creditPackage = creditPackages[input.packageId as keyof typeof creditPackages];
        if (!creditPackage) throw new Error("Invalid package");

        const newBalance = user.credits + creditPackage.credits;
        await updateUserCredits(ctx.user.id, newBalance);
        await recordCreditTransaction(
          ctx.user.id,
          creditPackage.credits,
          "purchase",
          `Purchased ${creditPackage.credits} credits (${creditPackage.description})`
        );

        return {
          success: true,
          newBalance,
          creditsAdded: creditPackage.credits,
        };
      }

      // Handle subscription purchase
      if (input.planId) {
        const plan = subscriptionPlans[input.planId as keyof typeof subscriptionPlans];
        if (!plan) throw new Error("Invalid plan");

        // TODO: Update user subscription in database
        // For now, add initial credits
        const initialCredits = plan.monthlyCredits || 500;
        const newBalance = user.credits + initialCredits;
        await updateUserCredits(ctx.user.id, newBalance);
        await recordCreditTransaction(
          ctx.user.id,
          initialCredits,
          "purchase",
          `Subscribed to ${plan.name} plan`
        );

        return {
          success: true,
          newBalance,
          plan: plan.name,
        };
      }

      throw new Error("No package or plan specified");
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
      // TODO: Implement billing history query
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
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getUser(ctx.user.id);
    if (!user) throw new Error("User not found");

    // TODO: Cancel subscription in Stripe
    await recordCreditTransaction(
      ctx.user.id,
      0,
      "usage",
      "Subscription cancelled"
    );

    return { success: true };
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
});

export type PaymentRouter = typeof paymentRouter;

