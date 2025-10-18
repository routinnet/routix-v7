import { ThumbnailMetadataExtracted } from './reference-thumbnail.service';

/**
 * Advanced Prompt Engineering Service
 * Optimizes prompts for DALL-E 3 to generate viral-quality YouTube thumbnails
 */

// Comprehensive style library for YouTube thumbnails
const STYLE_LIBRARY = {
  dramatic: {
    keywords: ['dramatic lighting', 'high contrast', 'cinematic', 'bold shadows'],
    colorIntensity: 'high',
    mood: 'intense',
  },
  minimalist: {
    keywords: ['clean', 'simple', 'uncluttered', 'elegant', 'minimal'],
    colorIntensity: 'low',
    mood: 'sophisticated',
  },
  colorful: {
    keywords: ['vibrant', 'saturated colors', 'rainbow', 'multicolor', 'bright palette'],
    colorIntensity: 'very high',
    mood: 'energetic',
  },
  professional: {
    keywords: ['professional', 'corporate', 'polished', 'sleek', 'modern'],
    colorIntensity: 'medium',
    mood: 'trustworthy',
  },
  casual: {
    keywords: ['friendly', 'approachable', 'fun', 'playful', 'relaxed'],
    colorIntensity: 'medium',
    mood: 'welcoming',
  },
  dark: {
    keywords: ['dark background', 'moody', 'mysterious', 'night', 'shadows'],
    colorIntensity: 'low',
    mood: 'mysterious',
  },
  neon: {
    keywords: ['neon lights', 'glowing', 'electric', 'futuristic', 'bright neon'],
    colorIntensity: 'very high',
    mood: 'futuristic',
  },
  vintage: {
    keywords: ['retro', 'vintage', 'nostalgic', 'old-school', 'classic'],
    colorIntensity: 'medium',
    mood: 'nostalgic',
  },
};

// Mood enhancement library
const MOOD_LIBRARY = {
  shocked: {
    expressions: ['wide eyes', 'open mouth', 'surprised expression', 'jaw-dropping'],
    intensity: 'high',
    keywords: ['shocked', 'amazed', 'stunned', 'astonished'],
  },
  excited: {
    expressions: ['bright smile', 'energetic pose', 'dynamic motion', 'jumping'],
    intensity: 'high',
    keywords: ['excited', 'enthusiastic', 'energetic', 'vibrant'],
  },
  curious: {
    expressions: ['raised eyebrow', 'questioning look', 'intrigued', 'interested'],
    intensity: 'medium',
    keywords: ['curious', 'intriguing', 'mysterious', 'thought-provoking'],
  },
  angry: {
    expressions: ['furrowed brow', 'intense stare', 'clenched jaw', 'fierce'],
    intensity: 'high',
    keywords: ['angry', 'fierce', 'intense', 'powerful'],
  },
  happy: {
    expressions: ['genuine smile', 'warm eyes', 'relaxed face', 'content'],
    intensity: 'medium',
    keywords: ['happy', 'joyful', 'cheerful', 'positive'],
  },
  sad: {
    expressions: ['downturned mouth', 'sad eyes', 'melancholic', 'emotional'],
    intensity: 'medium',
    keywords: ['sad', 'emotional', 'touching', 'heartfelt'],
  },
  confused: {
    expressions: ['tilted head', 'uncertain expression', 'questioning', 'puzzled'],
    intensity: 'medium',
    keywords: ['confused', 'puzzled', 'uncertain', 'mysterious'],
  },
};

// Lighting techniques
const LIGHTING_LIBRARY = {
  dramatic: 'dramatic side lighting with deep shadows',
  soft: 'soft, diffused lighting with minimal shadows',
  bright: 'bright, even lighting with high visibility',
  dim: 'dim, moody lighting with low key setup',
  natural: 'natural daylight with realistic shadows',
  backlit: 'backlit with rim lighting and silhouette effects',
  neon: 'neon and LED lighting with glowing effects',
  spotlight: 'spotlight effect with subject illuminated against dark background',
};

// Composition patterns
const COMPOSITION_PATTERNS = {
  rule_of_thirds: 'subject positioned at intersection of rule of thirds grid',
  centered: 'subject centered in frame for maximum impact',
  leading_lines: 'leading lines directing viewer attention to subject',
  framing: 'subject framed by natural or architectural elements',
  depth: 'multiple layers creating depth and visual interest',
  symmetry: 'symmetrical composition for balanced, professional look',
  diagonal: 'diagonal composition for dynamic, energetic feel',
  negative_space: 'generous negative space emphasizing subject',
};

// Quality enhancement keywords
const QUALITY_KEYWORDS = [
  '4k quality',
  'ultra detailed',
  'professional photography',
  'high resolution',
  'cinematic quality',
  'studio lighting',
  'sharp focus',
  'perfect composition',
  'trending on youtube',
  'viral thumbnail style',
];

/**
 * Build a comprehensive prompt from metadata
 */
export function buildOptimizedPrompt(
  userPrompt: string,
  userMetadata: Partial<ThumbnailMetadataExtracted>,
  referenceMetadata: ThumbnailMetadataExtracted,
  style?: string
): string {
  const parts: string[] = [];

  // 1. Main subject and content
  parts.push(`Create a YouTube thumbnail featuring: ${userPrompt}`);

  // 2. Composition instructions
  const composition = COMPOSITION_PATTERNS[referenceMetadata.symmetry as keyof typeof COMPOSITION_PATTERNS] ||
    COMPOSITION_PATTERNS.rule_of_thirds;
  parts.push(`Composition: ${composition}`);

  // 3. Lighting setup
  const lighting = LIGHTING_LIBRARY[referenceMetadata.lighting as keyof typeof LIGHTING_LIBRARY] ||
    LIGHTING_LIBRARY.dramatic;
  parts.push(`Lighting: ${lighting}`);

  // 4. Mood and expression
  if (userMetadata.mood || referenceMetadata.mood) {
    const mood = userMetadata.mood || referenceMetadata.mood;
    const moodData = MOOD_LIBRARY[mood as keyof typeof MOOD_LIBRARY];
    if (moodData) {
      parts.push(`Expression: ${moodData.expressions.join(', ')}`);
      parts.push(`Mood: ${moodData.keywords.join(', ')}`);
    }
  }

  // 5. Style application
  const styleKey = style || 'professional';
  const styleData = STYLE_LIBRARY[styleKey as keyof typeof STYLE_LIBRARY];
  if (styleData) {
    parts.push(`Style: ${styleData.keywords.join(', ')}`);
  }

  // 6. Color palette
  if (referenceMetadata.colorPalette) {
    let colorPalette: any = referenceMetadata.colorPalette;
    if (typeof colorPalette === 'string') {
      try {
        colorPalette = JSON.parse(colorPalette);
      } catch {
        // If not JSON, treat as comma-separated string
        colorPalette = (colorPalette as string).split(',').map((c: string) => c.trim());
      }
    }
    if (Array.isArray(colorPalette)) {
      const colors = colorPalette.slice(0, 3).join(', ');
      parts.push(`Color palette: ${colors}`);
    }
  }

  // 7. Text and typography (if applicable)
  if (referenceMetadata.hasText) {
    parts.push(`Text style: ${referenceMetadata.textStyle || 'bold'} typography`);
    parts.push(`Text position: ${referenceMetadata.textPosition || 'top'} of frame`);
  }

  // 8. Contrast and visual impact
  parts.push(`Contrast: ${referenceMetadata.contrast || 'high'} contrast for maximum impact`);

  // 9. Quality enhancement
  parts.push(`Quality: ${QUALITY_KEYWORDS.slice(0, 5).join(', ')}`);

  // 10. Final instructions
  parts.push('Optimized for YouTube, designed to stop scrolling and drive clicks');

  return parts.join('\n');
}

/**
 * Generate multiple prompt variations for A/B testing
 */
export function generatePromptVariations(
  userPrompt: string,
  userMetadata: Partial<ThumbnailMetadataExtracted>,
  referenceMetadata: ThumbnailMetadataExtracted,
  variationCount: number = 3
): string[] {
  const variations: string[] = [];
  const styles = Object.keys(STYLE_LIBRARY).slice(0, variationCount);

  for (const style of styles) {
    const prompt = buildOptimizedPrompt(userPrompt, userMetadata, referenceMetadata, style);
    variations.push(prompt);
  }

  return variations;
}

/**
 * Enhance prompt with specific keywords for viral potential
 */
export function enhanceForViralPotential(
  basePrompt: string,
  topic?: string
): string {
  const viralKeywords = [
    'eye-catching',
    'attention-grabbing',
    'scroll-stopping',
    'viral-worthy',
    'trending',
    'high-engagement',
    'clickable',
    'memorable',
  ];

  const topicSpecificKeywords: Record<string, string[]> = {
    gaming: ['epic gameplay', 'intense action', 'winning moment', 'gameplay highlight'],
    tech: ['cutting-edge', 'innovative', 'futuristic', 'high-tech'],
    crypto: ['blockchain', 'digital', 'decentralized', 'crypto-themed'],
    fitness: ['athletic', 'muscular', 'energetic', 'powerful'],
    education: ['informative', 'clear', 'professional', 'educational'],
    lifestyle: ['aspirational', 'stylish', 'trendy', 'fashionable'],
    business: ['corporate', 'professional', 'growth', 'success'],
    music: ['musical', 'rhythmic', 'colorful', 'expressive'],
  };

  let enhancedPrompt = basePrompt;

  // Add viral keywords
  enhancedPrompt += `\n\nMake it ${viralKeywords.slice(0, 3).join(', ')}`;

  // Add topic-specific keywords
  if (topic && topicSpecificKeywords[topic]) {
    enhancedPrompt += `\n\nIncorporate: ${topicSpecificKeywords[topic].join(', ')}`;
  }

  return enhancedPrompt;
}

/**
 * Create a prompt template for specific thumbnail types
 */
export function createTemplatePrompt(
  thumbnailType: 'reaction' | 'tutorial' | 'review' | 'vlog' | 'gaming' | 'news',
  subject: string,
  metadata: Partial<ThumbnailMetadataExtracted>
): string {
  const templates: Record<string, string> = {
    reaction: `YouTube reaction thumbnail: ${subject}. Person with shocked/excited expression, bright colors, high contrast. Dramatic lighting with emphasis on facial expression. Text overlay ready space. Professional quality, trending thumbnail style.`,

    tutorial: `YouTube tutorial thumbnail: ${subject}. Clean, organized layout with step-by-step visual elements. Professional, educational aesthetic. Clear hierarchy of information. Minimalist style with focus on clarity. High contrast for readability.`,

    review: `YouTube review thumbnail: ${subject}. Product or subject prominently displayed with professional lighting. Reviewer's expression showing opinion (satisfied/impressed). Clean background with product-focused composition. Professional, trustworthy aesthetic.`,

    vlog: `YouTube vlog thumbnail: ${subject}. Authentic, relatable scene with person in natural setting. Warm, inviting lighting. Genuine emotion and expression. Lifestyle aesthetic. Engaging and approachable composition.`,

    gaming: `YouTube gaming thumbnail: ${subject}. Epic gaming moment with intense action. Vibrant colors and high contrast. Player's reaction visible. Gaming aesthetic with dynamic composition. Exciting, energetic mood.`,

    news: `YouTube news thumbnail: ${subject}. Professional, serious aesthetic. Clear, readable layout. High contrast for visibility. Authoritative composition. Breaking news style with urgency. Professional quality, journalistic approach.`,
  };

  let prompt = templates[thumbnailType] || templates.review;

  // Enhance with metadata
  if (metadata.mood) {
    prompt += ` Mood: ${metadata.mood}.`;
  }
  if (metadata.lighting) {
    prompt += ` Lighting: ${metadata.lighting}.`;
  }

  return prompt;
}

/**
 * Optimize prompt for specific DALL-E 3 strengths
 */
export function optimizeForDALLE3(basePrompt: string): string {
  // DALL-E 3 specific optimizations
  const dalle3Enhancements = [
    'Highly detailed and photorealistic',
    'Professional studio quality',
    'Sharp focus on subject',
    'Vibrant, saturated colors',
    'Professional composition',
    'Cinematic lighting setup',
  ];

  let optimized = basePrompt;

  // Add DALL-E 3 specific instructions
  optimized += `\n\nDALLE-3 Optimization:\n`;
  optimized += dalle3Enhancements.slice(0, 3).join('\n');
  optimized += `\n\nAvoid: Watermarks, text that's hard to read, blurry elements, low contrast`;

  return optimized;
}

/**
 * Score a prompt for quality and viral potential
 */
export function scorePromptQuality(prompt: string): {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  let score = 50; // Base score

  // Check for quality keywords
  const qualityKeywordCount = QUALITY_KEYWORDS.filter(kw => prompt.toLowerCase().includes(kw)).length;
  if (qualityKeywordCount > 3) {
    strengths.push('Strong quality emphasis');
    score += 15;
  } else if (qualityKeywordCount === 0) {
    weaknesses.push('Missing quality keywords');
    recommendations.push('Add quality descriptors like "4k", "professional", "cinematic"');
  }

  // Check for composition instructions
  if (prompt.toLowerCase().includes('composition') || prompt.toLowerCase().includes('rule of thirds')) {
    strengths.push('Good composition guidance');
    score += 10;
  } else {
    recommendations.push('Add specific composition instructions');
  }

  // Check for lighting description
  if (prompt.toLowerCase().includes('light') || prompt.toLowerCase().includes('shadow')) {
    strengths.push('Detailed lighting instructions');
    score += 10;
  } else {
    weaknesses.push('Missing lighting details');
    recommendations.push('Specify lighting setup (dramatic, soft, bright, etc.)');
  }

  // Check for mood/emotion
  if (prompt.toLowerCase().includes('mood') || prompt.toLowerCase().includes('expression')) {
    strengths.push('Clear emotional direction');
    score += 10;
  }

  // Check for color guidance
  if (prompt.toLowerCase().includes('color') || prompt.toLowerCase().includes('palette')) {
    strengths.push('Color palette specified');
    score += 5;
  } else {
    recommendations.push('Specify color palette for consistency');
  }

  // Check for viral keywords
  const viralKeywords = ['viral', 'trending', 'clickable', 'engagement', 'scroll-stopping'];
  const viralCount = viralKeywords.filter(kw => prompt.toLowerCase().includes(kw)).length;
  if (viralCount > 0) {
    strengths.push('Viral optimization included');
    score += 10;
  }

  // Check prompt length
  if (prompt.length < 100) {
    weaknesses.push('Prompt too short');
    recommendations.push('Expand prompt with more detailed instructions');
  } else if (prompt.length > 1000) {
    weaknesses.push('Prompt too long');
    recommendations.push('Condense to essential instructions');
  } else {
    strengths.push('Optimal prompt length');
    score += 5;
  }

  // Cap score at 100
  score = Math.min(100, score);

  return {
    score,
    strengths,
    weaknesses,
    recommendations,
  };
}

/**
 * Refine prompt based on feedback
 */
export function refinePrompt(
  originalPrompt: string,
  feedback: {
    tooMuchFocus?: string;
    needsMoreFocus?: string;
    colorIssue?: string;
    lightingIssue?: string;
    compositionIssue?: string;
  }
): string {
  let refined = originalPrompt;

  if (feedback.tooMuchFocus) {
    refined = refined.replace(feedback.tooMuchFocus, `less emphasis on ${feedback.tooMuchFocus}`);
  }

  if (feedback.needsMoreFocus) {
    refined += `\n\nIncrease focus on: ${feedback.needsMoreFocus}`;
  }

  if (feedback.colorIssue) {
    refined += `\n\nColor adjustment: ${feedback.colorIssue}`;
  }

  if (feedback.lightingIssue) {
    refined += `\n\nLighting adjustment: ${feedback.lightingIssue}`;
  }

  if (feedback.compositionIssue) {
    refined += `\n\nComposition adjustment: ${feedback.compositionIssue}`;
  }

  return refined;
}



