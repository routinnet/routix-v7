import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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

