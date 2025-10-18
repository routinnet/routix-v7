import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createConversation,
  getConversations,
  addChatMessage,
  getChatMessages,
  createThumbnail,
  updateThumbnailStatus,
  getUserThumbnails,
  getTemplates,
  getTemplatesByCategory,
  recordCreditTransaction,
  getUser,
  updateUserCredits,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut, storageGet } from "./storage";
import { paymentRouter } from "./payment";
import { adminRouter } from "./admin";

export const appRouter = router({
  system: systemRouter,
  payment: paymentRouter,
  admin: adminRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Conversation management
  conversation: router({
    create: protectedProcedure
      .input(z.object({ title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await createConversation(ctx.user.id, input.title);
        return { conversationId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getConversations(ctx.user.id);
    }),

    delete: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Archive conversation (soft delete)
        // TODO: Implement archive logic in db.ts
        return { success: true };
      }),
  }),

  // Chat messages
  chat: router({
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Add user message to database
        await addChatMessage(input.conversationId, "user", input.message);

        // Get conversation history for context
        const history = await getChatMessages(input.conversationId);

        // Call LLM to generate response
        const systemMessage = {
          role: "system" as const,
          content:
            "You are Routix, an AI assistant specialized in helping users create stunning thumbnails. Help them describe what they want, suggest styles, and guide them through the thumbnail generation process. Be friendly, creative, and professional. When users ask to generate a thumbnail, provide a refined prompt that includes: visual elements, color scheme, text content, style, and mood.",
        };

        const historyMessages = history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        const response = await invokeLLM({
          messages: [systemMessage, ...historyMessages],
        });

        const assistantMessage =
          typeof response.choices[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "I apologize, I could not generate a response.";

        // Add assistant response to database
        await addChatMessage(input.conversationId, "assistant", assistantMessage);

        return {
          response: assistantMessage,
        };
      }),

    getHistory: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        return await getChatMessages(input.conversationId);
      }),

    // Refine prompt with AI
    refinePrompt: protectedProcedure
      .input(
        z.object({
          originalPrompt: z.string(),
          feedback: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const systemMessage = {
          role: "system" as const,
          content:
            "You are an expert at refining image generation prompts. Take the user's feedback and original prompt, and create an improved, detailed prompt for AI image generation. The prompt should be specific, vivid, and include visual details, colors, style, and mood. Return only the refined prompt, nothing else.",
        };

        const userMessage = {
          role: "user" as const,
          content: `Original prompt: "${input.originalPrompt}"\n\nUser feedback: "${input.feedback}"\n\nPlease refine the prompt based on the feedback.`,
        };

        const response = await invokeLLM({
          messages: [systemMessage, userMessage],
        });

        const refinedPrompt =
          typeof response.choices[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : input.originalPrompt;

        return { refinedPrompt };
      }),
  }),

  // Thumbnail generation
  thumbnail: router({
    generate: protectedProcedure
      .input(
        z.object({
          conversationId: z.string().optional(),
          prompt: z.string(),
          templateId: z.string().optional(),
          style: z.string().optional(),
          aspectRatio: z.enum(["16:9", "1:1", "9:16"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUser(ctx.user.id);
        if (!user) throw new Error("User not found");

        // Check if user has enough credits (2 credits per generation)
        const creditsNeeded = 2;
        if (user.credits < creditsNeeded) {
          throw new Error("Insufficient credits");
        }

        // Create thumbnail record
        const thumbnailId = await createThumbnail(
          ctx.user.id,
          input.conversationId,
          input.prompt,
          input.templateId
        );

        // Update status to generating
        await updateThumbnailStatus(thumbnailId, "generating");

        // Deduct credits immediately
        await updateUserCredits(ctx.user.id, user.credits - creditsNeeded);
        await recordCreditTransaction(
          ctx.user.id,
          -creditsNeeded,
          "usage",
          `Thumbnail generation: ${input.prompt.substring(0, 50)}`
        );

        // Generate image asynchronously
        try {
          const aspectRatioText =
            input.aspectRatio === "1:1"
              ? "square (1:1)"
              : input.aspectRatio === "9:16"
                ? "vertical (9:16)"
                : "landscape (16:9)";

          const { url: imageUrl } = await generateImage({
            prompt: `Create a professional ${aspectRatioText} thumbnail: ${input.prompt}. Style: ${input.style || "modern"}. High quality, eye-catching, vibrant colors, professional design.`,
          });

          // Upload to S3 and get URL
          const fileName = `thumbnails/${ctx.user.id}/${thumbnailId}.png`;
          const { url: s3Url } = await storagePut(fileName, imageUrl as string, "image/png");

          // Update thumbnail with generated image
          await updateThumbnailStatus(
            thumbnailId,
            "completed",
            s3Url,
            creditsNeeded
          );
        } catch (error) {
          console.error("Image generation failed:", error);
          await updateThumbnailStatus(thumbnailId, "failed");
          // Refund credits on failure
          await updateUserCredits(ctx.user.id, user.credits);
          await recordCreditTransaction(
            ctx.user.id,
            creditsNeeded,
            "refund",
            "Failed thumbnail generation"
          );
        }

        return { thumbnailId };
      }),

    getStatus: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .query(async ({ ctx, input }) => {
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const thumbnail = thumbnails.find((t) => t.id === input.thumbnailId);
        return thumbnail;
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getUserThumbnails(ctx.user.id);
    }),

    // Download thumbnail
    getDownloadUrl: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .query(async ({ ctx, input }) => {
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const thumbnail = thumbnails.find((t) => t.id === input.thumbnailId);

        if (!thumbnail || !thumbnail.imageUrl) {
          throw new Error("Thumbnail not found or not ready");
        }

        // Generate presigned URL valid for 24 hours
        const { url: downloadUrl } = await storageGet(thumbnail.imageUrl as string, 86400);

        return { downloadUrl };
      }),

    // Regenerate thumbnail with different parameters
    regenerate: protectedProcedure
      .input(
        z.object({
          thumbnailId: z.string(),
          prompt: z.string(),
          style: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUser(ctx.user.id);
        if (!user) throw new Error("User not found");

        const creditsNeeded = 2;
        if (user.credits < creditsNeeded) {
          throw new Error("Insufficient credits");
        }

        // Create new thumbnail record with same conversation
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const originalThumbnail = thumbnails.find(
          (t) => t.id === input.thumbnailId
        );

        if (!originalThumbnail) {
          throw new Error("Original thumbnail not found");
        }

        const newThumbnailId = await createThumbnail(
          ctx.user.id,
          originalThumbnail.conversationId || undefined,
          input.prompt,
          originalThumbnail.templateId || undefined
        );

        await updateThumbnailStatus(newThumbnailId, "generating");

        // Deduct credits
        await updateUserCredits(ctx.user.id, user.credits - creditsNeeded);
        await recordCreditTransaction(
          ctx.user.id,
          -creditsNeeded,
          "usage",
          `Thumbnail regeneration: ${input.prompt.substring(0, 50)}`
        );

        // Generate image
        try {
          const { url: imageUrl } = await generateImage({
            prompt: `Create a professional YouTube thumbnail: ${input.prompt}. Style: ${input.style || "modern"}. High quality, eye-catching, 1280x720px.`,
          });

          const fileName = `thumbnails/${ctx.user.id}/${newThumbnailId}.png`;
          const { url: s3Url } = await storagePut(fileName, imageUrl as string, "image/png");

          await updateThumbnailStatus(
            newThumbnailId,
            "completed",
            s3Url,
            creditsNeeded
          );
        } catch (error) {
          console.error("Image regeneration failed:", error);
          await updateThumbnailStatus(newThumbnailId, "failed");
          await updateUserCredits(ctx.user.id, user.credits);
          await recordCreditTransaction(
            ctx.user.id,
            creditsNeeded,
            "refund",
            "Failed thumbnail regeneration"
          );
        }

        return { thumbnailId: newThumbnailId };
      }),

    // Delete thumbnail
    delete: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const thumbnail = thumbnails.find((t) => t.id === input.thumbnailId);

        if (!thumbnail) {
          throw new Error("Thumbnail not found");
        }

        // TODO: Implement soft delete in db.ts
        return { success: true };
      }),
  }),

  // Templates
  template: router({
    list: publicProcedure.query(async () => {
      return await getTemplates();
    }),

    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await getTemplatesByCategory(input.category);
      }),

    // Get template categories
    getCategories: publicProcedure.query(async () => {
      const templates = await getTemplates();
      const categories = Array.from(
        new Set(templates.map((t) => t.category).filter(Boolean))
      );
      return categories;
    }),
  }),

  // User profile and credits
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getUser(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement profile update in db.ts
        const user = await getUser(ctx.user.id);
        return user || { id: ctx.user.id, credits: 0 };
      }),

    buyCredits: protectedProcedure
      .input(z.object({ amount: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUser(ctx.user.id);
        if (!user) throw new Error("User not found");

        const newBalance = user.credits + input.amount;
        await updateUserCredits(ctx.user.id, newBalance);
        await recordCreditTransaction(
          ctx.user.id,
          input.amount,
          "purchase",
          `Purchased ${input.amount} credits`
        );

        return { newBalance };
      }),

    // Get credit history
    getCreditHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        // TODO: Implement credit history query in db.ts
        return [];
      }),
  }),
});

export type AppRouter = typeof appRouter;

