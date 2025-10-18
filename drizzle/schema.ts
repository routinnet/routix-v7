import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  credits: int("credits").default(50).notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "pro", "enterprise"]).default("free").notNull(),
  trialThumbnailsUsed: int("trialThumbnailsUsed").default(0).notNull(), // New: Track thumbnails used during free trial
  referralCode: varchar("referralCode", { length: 64 }).unique(), // New: User's unique referral code
  referredBy: varchar("referredBy", { length: 64 }), // New: ID of the user who referred this user
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Subscription Plans
export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }),
  creditsPerMonth: int("creditsPerMonth"),
  maxThumbnails: int("maxThumbnails"),
  isPremium: boolean("isPremium").default(false),
  stripeProductId: varchar("stripeProductId", { length: 255 }), // New: Stripe Product ID
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// User Subscriptions
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(), // New: Stripe Subscription ID
  status: mysqlEnum("status", ["active", "canceled", "past_due", "unpaid"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Referral system
export const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  referrerId: varchar("referrerId", { length: 64 }).notNull(),
  referredId: varchar("referredId", { length: 64 }).notNull(),
  bonusCreditsAwarded: int("bonusCreditsAwarded").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// Coupon/Promo codes
export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 255 }).unique().notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  maxUses: int("maxUses"),
  timesUsed: int("timesUsed").default(0),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// Conversations/Chat history
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// Chat messages
export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Thumbnails
export const thumbnails = mysqlTable("thumbnails", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  conversationId: varchar("conversationId", { length: 64 }),
  prompt: text("prompt").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  templateId: varchar("templateId", { length: 64 }),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  creditsUsed: int("creditsUsed").default(0),
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"),
  style: varchar("style", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Thumbnail = typeof thumbnails.$inferSelect;
export type InsertThumbnail = typeof thumbnails.$inferInsert;

// Templates
export const templates = mysqlTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  isPremium: boolean("isPremium").default(false),
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"),
  style: varchar("style", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// Credit transactions
export const creditTransactions = mysqlTable("creditTransactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "refund", "bonus", "referral_bonus"]).notNull(), // New: Added referral_bonus type
  description: varchar("description", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }), // New: Link to Stripe Invoice
  createdAt: timestamp("createdAt").defaultNow(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

