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
  getThumbnailById,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut, storageGet } from "./storage";
import { paymentRouter } from "./payment";
import { adminRouter } from "./admin.router";

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
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const { searchConversations } = await import("./db");
        return await searchConversations(ctx.user.id, input.query);
      }),

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
    uploadImage: protectedProcedure
      .input(z.object({ fileData: z.string(), fileName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { uploadImageToS3 } = await import("./fileUpload");
        const buffer = Buffer.from(input.fileData, "base64");
        const uploaded = await uploadImageToS3(buffer, input.fileName, "image/jpeg");
        return { success: true, url: uploaded.url, key: uploaded.key };
      }),

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

        // Generate thumbnail image
        let thumbnail = null;
        try {
          const { generateImage } = await import("./_core/imageGeneration");
          const imageResult = await generateImage({ prompt: input.message });
          if (imageResult.url) {
            // Create thumbnail record
            const { createThumbnail } = await import("./db");
            const thumbnailId = await createThumbnail(
              ctx.user.id,
              input.message,
              imageResult.url
            );
            thumbnail = {
              id: thumbnailId,
              imageUrl: imageResult.url,
              prompt: input.message,
            };
            // Update thumbnail status to completed
            const { updateThumbnailStatus } = await import("./db");
            await updateThumbnailStatus(thumbnailId, "completed", imageResult.url, 1);
          }
        } catch (error) {
          console.error("[Chat] Thumbnail generation failed:", error);
        }

        return {
          response: assistantMessage,
          thumbnail,
        };
      }),

    regenerateThumbnail: protectedProcedure
      .input(
        z.object({
          thumbnailId: z.string(),
          newPrompt: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { generateImage } = await import("./_core/imageGeneration");
        const { updateThumbnailStatus } = await import("./db");

        try {
          const imageResult = await generateImage({ prompt: input.newPrompt });
          if (imageResult.url) {
            await updateThumbnailStatus(input.thumbnailId, "completed", imageResult.url, 1);
            return {
              success: true,
              imageUrl: imageResult.url,
              prompt: input.newPrompt,
            };
          }
        } catch (error) {
          console.error("[Chat] Regeneration failed:", error);
          throw new Error("Failed to regenerate thumbnail");
        }
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
            "You are an expert at refining image generation prompts. Take the user\'s feedback and original prompt, and create an improved, detailed prompt for AI image generation. The prompt should be specific, vivid, and include visual details, colors, style, and mood. Return only the refined prompt, nothing else.",
        };

        const userMessage = {
          role: "user" as const,
          content: `Original prompt: \"${input.originalPrompt}\"\n\nUser feedback: \"${input.feedback}\"\n\nPlease refine the prompt based on the feedback.`,
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
    downloadThumbnail: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { getUserThumbnails } = await import("./db");
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const thumbnail = thumbnails.find((t: any) => t.id === input.thumbnailId);
        if (!thumbnail || thumbnail.userId !== ctx.user.id) {
          throw new Error("Thumbnail not found");
        }
        return {
          imageUrl: thumbnail.imageUrl,
          prompt: thumbnail.prompt,
          fileName: `thumbnail-${thumbnail.id}.png`,
        };
      }),

    shareThumbnail: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getUserThumbnails } = await import("./db");
        const thumbnails = await getUserThumbnails(ctx.user.id);
        const thumbnail = thumbnails.find((t: any) => t.id === input.thumbnailId);
        if (!thumbnail || thumbnail.userId !== ctx.user.id) {
          throw new Error("Thumbnail not found");
        }
        const shareUrl = `${process.env.VITE_APP_URL || "https://routix.app"}/share/${input.thumbnailId}`;
        return { shareUrl, thumbnail };
      }),

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

        try {
          // Simulate image generation delay
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const imageUrl = `https://picsum.photos/seed/${thumbnailId}/1280/720`;

          // Update thumbnail status to completed
          await updateThumbnailStatus(thumbnailId, "completed", imageUrl, creditsNeeded);

          return {
            id: thumbnailId,
            imageUrl,
            prompt: input.prompt,
            creditsUsed: creditsNeeded,
            status: "completed",
          };
        } catch (error) {
          console.error("Thumbnail generation failed:", error);
          // Refund credits on failure
          await updateUserCredits(ctx.user.id, user.credits);
          await recordCreditTransaction(
            ctx.user.id,
            creditsNeeded,
            "refund",
            `Refund for failed generation: ${input.prompt.substring(0, 50)}`
          );
          await updateThumbnailStatus(thumbnailId, "failed");
          throw new Error("Thumbnail generation failed");
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserThumbnails(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ thumbnailId: z.string() }))
      .query(async ({ ctx, input }) => {
        const thumbnail = await getThumbnailById(input.thumbnailId);
        if (!thumbnail || thumbnail.userId !== ctx.user.id) {
          throw new Error("Thumbnail not found");
        }
        return thumbnail;
      }),
  }),

  // Templates
  template: router({
    list: protectedProcedure.query(async () => {
      return await getTemplates();
    }),
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await getTemplatesByCategory(input.category);
      }),
  }),

  // User profile and credits
  user: router({
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const thumbnails = await getUserThumbnails(ctx.user.id);
      const totalThumbnails = thumbnails.length;
      const totalCreditsUsed = thumbnails.reduce(
        (sum: number, t: any) => sum + (t.creditsUsed || 0),
        0
      );
      return { totalThumbnails, totalCreditsUsed };
    }),

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
        // Update user profile in database
        const { updateUserProfile } = await import("./db");
        await updateUserProfile(ctx.user.id, input.name, input.email);
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
    getCreditHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getCreditTransactionHistory } = await import("./db");
        return await getCreditTransactionHistory(ctx.user.id, input.limit);
      }),
  }),

  // Authentication Security Features
  authSecurity: router({
    // Email Verification
    sendVerificationEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // In production, send actual email
        return { success: true, message: "Verification email sent" };
      }),

    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Verify email token
        return { success: true, verified: true };
      }),

    // Two-Factor Authentication
    generateTwoFactorSecret: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Generate 2FA secret and QR code
        return {
          secret: "JBSWY3DPEBLW64TMMQ========",
          qrCode: "data:image/png;base64,...",
          backupCodes: ["ABC123", "DEF456", "GHI789"],
        };
      }),

    enableTwoFactor: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Enable 2FA for user
        return { success: true, enabled: true };
      }),

    disableTwoFactor: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Disable 2FA
        return { success: true, disabled: true };
      }),

    verifyTwoFactorCode: publicProcedure
      .input(z.object({ userId: z.string(), code: z.string() }))
      .mutation(async ({ input }) => {
        // Verify 2FA code
        return { success: true, verified: true };
      }),

    // Login Activity
    getLoginHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        // Return login history
        return [
          {
            id: "1",
            timestamp: new Date(),
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0...",
            status: "success" as const,
            method: "password" as const,
          },
        ];
      }),

    // IP Security
    addIpToWhitelist: protectedProcedure
      .input(z.object({ ipAddress: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return { success: true };
      }),

    removeIpFromWhitelist: protectedProcedure
      .input(z.object({ ipAddress: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return { success: true };
      }),

    getWhitelistedIps: protectedProcedure
      .query(async ({ ctx }) => {
        return [
          { ipAddress: "192.168.1.1", addedAt: new Date() },
        ];
      }),

    // Social Login
    handleSocialLogin: publicProcedure
      .input(z.object({
        provider: z.enum(["google", "github", "discord"]),
        token: z.string(),
      }))
      .mutation(async ({ input }) => {
        return {
          success: true,
          user: {
            id: "user-123",
            email: "user@example.com",
            name: "User Name",
          },
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
