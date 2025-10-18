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

export const appRouter = router({
  system: systemRouter,

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
            "You are Routix, an AI assistant specialized in helping users create stunning thumbnails. Help them describe what they want, suggest styles, and guide them through the thumbnail generation process. Be friendly, creative, and professional.",
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
          const { url: imageUrl } = await generateImage({
            prompt: `Create a professional YouTube thumbnail: ${input.prompt}. Style: ${input.style || "modern"}. High quality, eye-catching, 1280x720px.`,
          });

          // Update thumbnail with generated image
          await updateThumbnailStatus(
            thumbnailId,
            "completed",
            imageUrl,
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
  }),

  // User profile and credits
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getUser(ctx.user.id);
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
  }),
});

export type AppRouter = typeof appRouter;

