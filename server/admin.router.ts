import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { plans, coupons, creditTransactions, subscriptions, users } from "../drizzle/schema";
import { eq, desc, gte, lte } from "drizzle-orm";
import { createCoupon, getCouponStats } from "./coupon.service";

/**
 * Admin Router for managing billing and monetization features
 * Requires admin role
 */
export const adminRouter = router({
  // Verify admin access
  verifyAdmin: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return { isAdmin: true };
  }),

  // ===== PLAN MANAGEMENT =====

  // Create a new subscription plan
  createPlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        priceMonthly: z.number().positive(),
        priceYearly: z.number().positive().optional(),
        creditsPerMonth: z.number().positive(),
        maxThumbnails: z.number().positive().optional(),
        isPremium: z.boolean().default(false),
        stripeProductId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const plan = {
          id: input.id,
          name: input.name,
          description: input.description,
          priceMonthly: input.priceMonthly.toString(),
          priceYearly: input.priceYearly?.toString(),
          creditsPerMonth: input.creditsPerMonth,
          maxThumbnails: input.maxThumbnails,
          isPremium: input.isPremium,
          stripeProductId: input.stripeProductId,
        };

        await (db as any).insert(plans).values(plan);
        return { success: true, plan };
      } catch (error) {
        console.error("Error creating plan:", error);
        throw new Error("Failed to create plan");
      }
    }),

  // Update a subscription plan
  updatePlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        priceMonthly: z.number().positive().optional(),
        priceYearly: z.number().positive().optional(),
        creditsPerMonth: z.number().positive().optional(),
        maxThumbnails: z.number().positive().optional(),
        isPremium: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;
        if (input.priceMonthly) updateData.priceMonthly = input.priceMonthly.toString();
        if (input.priceYearly) updateData.priceYearly = input.priceYearly.toString();
        if (input.creditsPerMonth) updateData.creditsPerMonth = input.creditsPerMonth;
        if (input.maxThumbnails) updateData.maxThumbnails = input.maxThumbnails;
        if (input.isPremium !== undefined) updateData.isPremium = input.isPremium;

        await (db as any).update(plans).set(updateData).where(eq(plans.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Error updating plan:", error);
        throw new Error("Failed to update plan");
      }
    }),

  // Get all plans
  getAllPlans: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const allPlans = await (db as any).query.plans.findMany();
      return allPlans;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw new Error("Failed to fetch plans");
    }
  }),

  // ===== COUPON MANAGEMENT =====

  // Create a new coupon
  createCoupon: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        maxUses: z.number().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      try {
        const coupon = await createCoupon(
          input.code,
          input.discountPercent,
          input.discountAmount,
          input.maxUses,
          input.expiresAt
        );
        return { success: true, coupon };
      } catch (error) {
        console.error("Error creating coupon:", error);
        throw new Error("Failed to create coupon");
      }
    }),

  // Get all coupons
  getAllCoupons: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const allCoupons = await (db as any).query.coupons.findMany({
        orderBy: (c: any) => [desc(c.createdAt)],
      });
      return allCoupons;
    } catch (error) {
      console.error("Error fetching coupons:", error);
      throw new Error("Failed to fetch coupons");
    }
  }),

  // Get coupon statistics
  getCouponStats: protectedProcedure
    .input(z.object({ couponId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      try {
        return await getCouponStats(input.couponId);
      } catch (error) {
        console.error("Error fetching coupon stats:", error);
        throw new Error("Failed to fetch coupon stats");
      }
    }),

  // ===== TRANSACTION MONITORING =====

  // Get all transactions
  getAllTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        type: z.enum(["purchase", "usage", "refund", "bonus", "referral_bonus"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const whereConditions = [];
        if (input.type) {
          whereConditions.push(eq(creditTransactions.type, input.type));
        }
        if (input.startDate) {
          whereConditions.push(gte(creditTransactions.createdAt, input.startDate));
        }
        if (input.endDate) {
          whereConditions.push(lte(creditTransactions.createdAt, input.endDate));
        }

        const transactions = await (db as any).query.creditTransactions.findMany({
          orderBy: (t: any) => [desc(t.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        return {
          transactions,
          total: transactions.length,
        };
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw new Error("Failed to fetch transactions");
      }
    }),

  // Get transaction statistics
  getTransactionStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const transactions = await (db as any).query.creditTransactions.findMany();

        const stats = {
          totalTransactions: transactions.length,
          totalCreditsProcessed: transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
          byType: {
            purchase: 0,
            usage: 0,
            refund: 0,
            bonus: 0,
            referral_bonus: 0,
          },
          revenue: 0,
        };

        transactions.forEach((t: any) => {
          if (t.type in stats.byType) {
            stats.byType[t.type as keyof typeof stats.byType]++;
          }
        });

        return stats;
      } catch (error) {
        console.error("Error fetching transaction stats:", error);
        throw new Error("Failed to fetch transaction stats");
      }
    }),

  // ===== SUBSCRIPTION MONITORING =====

  // Get all subscriptions
  getAllSubscriptions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["active", "canceled", "past_due", "unpaid"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const allSubscriptions = await (db as any).query.subscriptions.findMany({
          orderBy: (s: any) => [desc(s.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        return {
          subscriptions: allSubscriptions,
          total: allSubscriptions.length,
        };
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        throw new Error("Failed to fetch subscriptions");
      }
    }),

  // Get subscription statistics
  getSubscriptionStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const subscriptions = await (db as any).query.subscriptions.findMany();
      const users_list = await (db as any).query.users.findMany();

      const stats = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter((s: any) => s.status === "active").length,
        canceledSubscriptions: subscriptions.filter((s: any) => s.status === "canceled").length,
        totalUsers: users_list.length,
        usersByPlan: {
          free: users_list.filter((u: any) => u.subscriptionStatus === "free").length,
          pro: users_list.filter((u: any) => u.subscriptionStatus === "pro").length,
          enterprise: users_list.filter((u: any) => u.subscriptionStatus === "enterprise").length,
        },
      };

      return stats;
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      throw new Error("Failed to fetch subscription stats");
    }
  }),

  // ===== USER MANAGEMENT =====

  // Get user credit balance
  getUserCredits: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const user = await (db as any).query.users.findFirst({
          where: eq(users.id, input.userId),
        });

        if (!user) {
          throw new Error("User not found");
        }

        return {
          userId: user.id,
          credits: user.credits,
          subscriptionStatus: user.subscriptionStatus,
        };
      } catch (error) {
        console.error("Error fetching user credits:", error);
        throw new Error("Failed to fetch user credits");
      }
    }),

  // Manually adjust user credits
  adjustUserCredits: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const user = await (db as any).query.users.findFirst({
          where: eq(users.id, input.userId),
        });

        if (!user) {
          throw new Error("User not found");
        }

        const newBalance = user.credits + input.amount;

        await (db as any)
          .update(users)
          .set({ credits: newBalance })
          .where(eq(users.id, input.userId));

        // Record transaction
        await (db as any).insert(creditTransactions).values({
          id: `txn_${Date.now()}`,
          userId: input.userId,
          type: input.amount > 0 ? "bonus" : "usage",
          amount: Math.abs(input.amount),
          description: `Admin adjustment: ${input.reason}`,
        });

        return { success: true, newBalance };
      } catch (error) {
        console.error("Error adjusting user credits:", error);
        throw new Error("Failed to adjust user credits");
      }
    }),

  // Get dashboard statistics
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const allUsers = await (db as any).query.users.findMany();
      const allTransactions = await (db as any).query.creditTransactions.findMany();
      const allSubscriptions = await (db as any).query.subscriptions.findMany();

      const purchaseTransactions = allTransactions.filter((t: any) => t.type === "purchase");
      const totalRevenue = purchaseTransactions.length * 20;
      const successRate = purchaseTransactions.length > 0 ? (purchaseTransactions.length / allTransactions.length) : 0;
      const averageUserValue = allUsers.length > 0 ? totalRevenue / allUsers.length : 0;
      const activeUsers = allUsers.filter((u: any) => u.lastSignedIn && new Date(u.lastSignedIn) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
      const thumbnailsGenerated = allTransactions.filter((t: any) => t.type === "usage").length;

      return {
        totalUsers: allUsers.length,
        activeUsers,
        totalTransactions: allTransactions.length,
        totalSubscriptions: allSubscriptions.length,
        activeSubscriptions: allSubscriptions.filter((s: any) => s.status === "active").length,
        totalCreditsProcessed: allTransactions.reduce((sum: number, t: any) => sum + t.amount, 0),
        successRate,
        totalRevenue,
        averageUserValue,
        thumbnailsGenerated,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard stats");
    }
  }),

  // Get all users
  getAllUsers: protectedProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const allUsers = await (db as any).query.users.findMany();
        return { users: allUsers, total: allUsers.length };
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users");
      }
    }),

  // Update user role
  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await (db as any).update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { success: true };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error("Failed to update user role");
      }
    }),

  // Delete user
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await (db as any).delete(users).where(eq(users.id, input.userId));
        return { success: true };
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user");
      }
    }),
});

export type AdminRouter = typeof adminRouter;

