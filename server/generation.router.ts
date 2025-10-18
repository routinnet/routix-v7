import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { executeGenerationOrchestrator } from './ai-orchestrator.service';
import { completePostProductionPipeline } from './post-production.service';
import { getDb, recordCreditTransaction } from './db';

export const generationRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        userPrompt: z.string().min(5).max(2000),
        uploadedImages: z.array(z.string()).optional(),
        preferredStyle: z.string().optional(),
        preferredMood: z.string().optional(),
        topic: z.string().optional(),
        model: z.enum(['dall-e-3', 'routix-v1', 'routix-v2']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await executeGenerationOrchestrator({
          userId: ctx.user.id,
          userPrompt: input.userPrompt,
          uploadedImages: input.uploadedImages,
          preferredStyle: input.preferredStyle,
          preferredMood: input.preferredMood,
          topic: input.topic,
          model: input.model,
        });

        if (result.status === 'failed') {
          throw new Error(result.error || 'Generation failed');
        }

        const postProdResult = await completePostProductionPipeline(
          result.generatedImageUrl!,
          { brightness: 65, contrast: 75 }
        );

        const db = await getDb();
        if (db) {
          await recordCreditTransaction(
            ctx.user.id,
            -result.creditsUsed,
            'usage',
            result.id
          );
        }

        return {
          id: result.id,
          status: result.status,
          generatedImageUrl: postProdResult.processedImageUrl,
          generatedPrompt: result.generatedPrompt,
          referenceThumbnailId: result.referenceThumbnailId,
          qualityScore: postProdResult.qualityResult.overallScore / 100,
          creditsUsed: result.creditsUsed,
          model: input.model || 'dall-e-3',
        };
      } catch (error) {
        console.error('Generation error:', error);
        throw error;
      }
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return [];
        // Query generation history from database
        // In production, this would fetch from the generationHistory table
        return [];
      } catch (error) {
        console.error('Error fetching generation history:', error);
        return [];
      }
    }),

  getGenerationStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          totalGenerations: 0,
          averageQualityScore: 0,
          totalCreditsUsed: 0,
        };
      }
      // Calculate actual stats from database
      // In production, this would aggregate data from the generationHistory table
      return {
        totalGenerations: 0,
        averageQualityScore: 0,
        totalCreditsUsed: 0,
      };
    } catch (error) {
      console.error('Error fetching generation stats:', error);
      throw error;
    }
  }),

  validatePrompt: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .query(async ({ input }) => {
      try {
        const { scorePromptQuality } = await import('./prompt-engineer.service');
        const result = scorePromptQuality(input.prompt);
        return result;
      } catch (error) {
        console.error('Error validating prompt:', error);
        throw error;
      }
    }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: 'reaction',
        name: 'Reaction Thumbnail',
        description: 'Person with shocked/excited expression',
        category: 'general',
      },
      {
        id: 'tutorial',
        name: 'Tutorial Thumbnail',
        description: 'Clean, organized layout',
        category: 'education',
      },
      {
        id: 'review',
        name: 'Review Thumbnail',
        description: 'Product-focused with opinion',
        category: 'reviews',
      },
      {
        id: 'vlog',
        name: 'Vlog Thumbnail',
        description: 'Authentic, relatable scene',
        category: 'lifestyle',
      },
      {
        id: 'gaming',
        name: 'Gaming Thumbnail',
        description: 'Epic gaming moment',
        category: 'gaming',
      },
      {
        id: 'news',
        name: 'News Thumbnail',
        description: 'Professional, serious aesthetic',
        category: 'news',
      },
    ];
  }),
});

