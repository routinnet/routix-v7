import { getDb } from './db';
import { referenceThumbnails, thumbnailMetadata, topicPreferences } from '../drizzle/schema';
import { eq, like, desc } from 'drizzle-orm';

export interface ThumbnailMetadataExtracted {
  subjectPosition: string;
  textPosition: string;
  textAlignment: string;
  colorPalette: string[];
  lighting: string;
  contrast: string;
  mood: string;
  emotionalExpression: string;
  hasText: boolean;
  textStyle: string;
  hasFace: boolean;
  faceExpression: string;
  hasProduct: boolean;
  layerCount: number;
  symmetry: string;
  depthOfField: string;
  extractedPrompt: string;
  confidence: number;
}

/**
 * Upload and register a reference thumbnail
 */
export async function uploadReferenceThumbnail(
  title: string,
  description: string,
  imageUrl: string,
  category: string,
  style: string,
  viralScore: number = 0.8
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const thumbnail = {
      id: `ref_${Date.now()}`,
      title,
      description,
      imageUrl,
      category,
      style,
      viralScore: viralScore.toString(),
      isActive: true,
    };

    await (db as any).insert(referenceThumbnails).values(thumbnail);
    return thumbnail;
  } catch (error) {
    console.error('Error uploading reference thumbnail:', error);
    throw new Error('Failed to upload reference thumbnail');
  }
}

/**
 * Store extracted metadata for a reference thumbnail
 */
export async function storeMetadata(
  referenceThumbnailId: string,
  metadata: ThumbnailMetadataExtracted
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const metadataRecord = {
      id: `meta_${Date.now()}`,
      referenceThumbnailId,
      subjectPosition: metadata.subjectPosition,
      textPosition: metadata.textPosition,
      textAlignment: metadata.textAlignment,
      colorPalette: JSON.stringify(metadata.colorPalette),
      lighting: metadata.lighting,
      contrast: metadata.contrast,
      mood: metadata.mood,
      emotionalExpression: metadata.emotionalExpression,
      hasText: metadata.hasText,
      textStyle: metadata.textStyle,
      hasFace: metadata.hasFace,
      faceExpression: metadata.faceExpression,
      hasProduct: metadata.hasProduct,
      layerCount: metadata.layerCount,
      symmetry: metadata.symmetry,
      depthOfField: metadata.depthOfField,
      extractedPrompt: metadata.extractedPrompt,
      confidence: metadata.confidence.toString(),
    };

    await (db as any).insert(thumbnailMetadata).values(metadataRecord);
    return metadataRecord;
  } catch (error) {
    console.error('Error storing metadata:', error);
    throw new Error('Failed to store metadata');
  }
}

/**
 * Get all active reference thumbnails
 */
export async function getAllReferenceThumbnails(): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const thumbnails = await (db as any).query.referenceThumbnails.findMany({
      where: (t: any) => eq(t.isActive, true),
      orderBy: (t: any) => [desc(t.viralScore)],
    });

    return thumbnails;
  } catch (error) {
    console.error('Error fetching reference thumbnails:', error);
    throw new Error('Failed to fetch reference thumbnails');
  }
}

/**
 * Get reference thumbnails by category
 */
export async function getReferenceThumbnailsByCategory(category: string): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const thumbnails = await (db as any).query.referenceThumbnails.findMany({
      where: (t: any) => eq(t.category, category),
      orderBy: (t: any) => [desc(t.viralScore)],
    });

    return thumbnails;
  } catch (error) {
    console.error('Error fetching reference thumbnails by category:', error);
    throw new Error('Failed to fetch reference thumbnails');
  }
}

/**
 * Get metadata for a reference thumbnail
 */
export async function getMetadata(referenceThumbnailId: string): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const metadata = await (db as any).query.thumbnailMetadata.findFirst({
      where: (m: any) => eq(m.referenceThumbnailId, referenceThumbnailId),
    });

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    // Parse JSON fields
    return {
      ...metadata,
      colorPalette: JSON.parse(metadata.colorPalette || '[]'),
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw new Error('Failed to fetch metadata');
  }
}

/**
 * Find best matching reference thumbnails for a topic
 */
export async function findBestMatchingReferences(
  topic: string,
  style?: string,
  limit: number = 5
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // First, try to get topic preferences
    const topicPref = await (db as any).query.topicPreferences.findFirst({
      where: (t: any) => eq(t.topic, topic.toLowerCase()),
    });

    if (topicPref && topicPref.bestMatchingReferenceThumbnailIds) {
      const refIds = JSON.parse(topicPref.bestMatchingReferenceThumbnailIds);
      const thumbnails = await (db as any).query.referenceThumbnails.findMany({
        where: (t: any) => t.id.in(refIds),
        limit,
      });
      return thumbnails;
    }

    // Fallback: search by category or style
    const thumbnails = await (db as any).query.referenceThumbnails.findMany({
      where: (t: any) => 
        style ? eq(t.style, style) : eq(t.isActive, true),
      orderBy: (t: any) => [desc(t.viralScore)],
      limit,
    });

    return thumbnails;
  } catch (error) {
    console.error('Error finding matching references:', error);
    throw new Error('Failed to find matching references');
  }
}

/**
 * Update topic preferences with best matching references
 */
export async function updateTopicPreferences(
  topic: string,
  bestMatchingRefIds: string[],
  stylePreferences?: Record<string, number>,
  colorPreferences?: Record<string, number>
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const topicLower = topic.toLowerCase();

    // Check if topic preference exists
    const existing = await (db as any).query.topicPreferences.findFirst({
      where: (t: any) => eq(t.topic, topicLower),
    });

    const prefData = {
      id: existing?.id || `topic_${Date.now()}`,
      topic: topicLower,
      bestMatchingReferenceThumbnailIds: JSON.stringify(bestMatchingRefIds),
      stylePreferences: JSON.stringify(stylePreferences || {}),
      colorPreferences: JSON.stringify(colorPreferences || {}),
    };

    if (existing) {
      await (db as any)
        .update(topicPreferences)
        .set(prefData)
        .where(eq(topicPreferences.topic, topicLower));
    } else {
      await (db as any).insert(topicPreferences).values(prefData);
    }

    return prefData;
  } catch (error) {
    console.error('Error updating topic preferences:', error);
    throw new Error('Failed to update topic preferences');
  }
}

/**
 * Calculate similarity score between two metadata objects
 */
export function calculateSimilarityScore(
  userMetadata: Partial<ThumbnailMetadataExtracted>,
  referenceMetadata: ThumbnailMetadataExtracted
): number {
  let score = 0;
  let weightedCount = 0;

  // Subject position match (weight: 15%)
  if (userMetadata.subjectPosition === referenceMetadata.subjectPosition) {
    score += 15;
  }
  weightedCount += 15;

  // Mood match (weight: 20%)
  if (userMetadata.mood === referenceMetadata.mood) {
    score += 20;
  }
  weightedCount += 20;

  // Lighting match (weight: 15%)
  if (userMetadata.lighting === referenceMetadata.lighting) {
    score += 15;
  }
  weightedCount += 15;

  // Style match (weight: 15%)
  if (userMetadata.emotionalExpression === referenceMetadata.emotionalExpression) {
    score += 15;
  }
  weightedCount += 15;

  // Text position match (weight: 10%)
  if (userMetadata.textPosition === referenceMetadata.textPosition) {
    score += 10;
  }
  weightedCount += 10;

  // Contrast match (weight: 10%)
  if (userMetadata.contrast === referenceMetadata.contrast) {
    score += 10;
  }
  weightedCount += 10;

  // Calculate normalized score (0-1)
  return weightedCount > 0 ? score / weightedCount : 0;
}

/**
 * Get statistics on reference thumbnails
 */
export async function getReferenceThumbnailStats(): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const allThumbnails = await (db as any).query.referenceThumbnails.findMany();
    const categories = new Set(allThumbnails.map((t: any) => t.category));
    const styles = new Set(allThumbnails.map((t: any) => t.style));

    const avgViralScore =
      allThumbnails.reduce((sum: number, t: any) => sum + parseFloat(t.viralScore), 0) /
      allThumbnails.length;

    return {
      totalThumbnails: allThumbnails.length,
      categories: Array.from(categories),
      styles: Array.from(styles),
      averageViralScore: avgViralScore,
      highestViralScore: Math.max(...allThumbnails.map((t: any) => parseFloat(t.viralScore))),
    };
  } catch (error) {
    console.error('Error getting reference thumbnail stats:', error);
    throw new Error('Failed to get reference thumbnail stats');
  }
}



