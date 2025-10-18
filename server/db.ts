import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc, and, like } from "drizzle-orm";
import {
  InsertUser,
  users,
  conversations,
  chatMessages,
  thumbnails,
  templates,
  creditTransactions,
  type InsertConversation,
  type InsertChatMessage,
  type InsertThumbnail,
  type InsertCreditTransaction,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = "admin";
        values.role = "admin";
        updateSet.role = "admin";
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCredits(
  userId: string,
  newBalance: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update credits: database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({ credits: newBalance })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user credits:", error);
    throw error;
  }
}

// Conversation queries
export async function createConversation(
  userId: string,
  title: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(conversations).values({ id, userId, title });
  return id;
}

export async function getConversations(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId));
}

// Chat message queries
export async function addChatMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(chatMessages).values({ id, conversationId, role, content });
}

export async function getChatMessages(conversationId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));
}

// Thumbnail queries
export async function createThumbnail(
  userId: string,
  conversationId: string | undefined,
  prompt: string,
  templateId?: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `thumb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(thumbnails).values({
    id,
    userId,
    conversationId,
    prompt,
    templateId,
  });
  return id;
}

export async function updateThumbnailStatus(
  thumbnailId: string,
  status: "pending" | "generating" | "completed" | "failed",
  imageUrl?: string,
  creditsUsed?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status, updatedAt: new Date() };
  if (imageUrl) updateData.imageUrl = imageUrl;
  if (creditsUsed !== undefined) updateData.creditsUsed = creditsUsed;

  await db
    .update(thumbnails)
    .set(updateData)
    .where(eq(thumbnails.id, thumbnailId));
}

export async function getUserThumbnails(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(thumbnails)
    .where(eq(thumbnails.userId, userId));
}

// Template queries
export async function getTemplates() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(templates);
}

export async function getTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(templates)
    .where(eq(templates.category, category));
}

// Credit transaction queries
export async function recordCreditTransaction(
  userId: string,
  amount: number,
  type: "purchase" | "usage" | "refund" | "bonus",
  description?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(creditTransactions).values({
    id,
    userId,
    amount,
    type,
    description,
  });
}

// Additional user queries
export async function updateUserProfile(
  userId: string,
  name?: string,
  email?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;

  if (Object.keys(updateData).length === 0) return;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getUserCredits(userId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const user = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 ? user[0].credits : 0;
}

export async function getCreditTransactionHistory(
  userId: string,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

// Conversation search
export async function searchConversations(
  userId: string,
  query: string
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        like(conversations.title, `%${query}%`)
      )
    )
    .orderBy(desc(conversations.createdAt));
}

// Conversation soft delete
export async function deleteConversation(conversationId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // For now, we'll just delete associated messages and the conversation
  // In production, implement soft delete with an 'archived' flag
  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  await db
    .delete(conversations)
    .where(eq(conversations.id, conversationId));
}

// Thumbnail soft delete
export async function deleteThumbnail(thumbnailId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // For now, we'll just delete the thumbnail
  // In production, implement soft delete with a 'deleted' flag
  await db.delete(thumbnails).where(eq(thumbnails.id, thumbnailId));
}

// Get user by email
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Get all users (for admin)
export async function getAllUsers(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);
}

// Get user count (for admin)
export async function getUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: users.id })
    .from(users);

  return result.length;
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

