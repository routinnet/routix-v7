import { GoogleGenerativeAI } from '@google/generative-ai';
import { ThumbnailMetadataExtracted } from './reference-thumbnail.service';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || '');

/**
 * Analyze a thumbnail image using Gemini Vision to extract metadata
 */
export async function analyzeThumbnailImage(
  imageUrl: string
): Promise<ThumbnailMetadataExtracted> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Analyze this YouTube thumbnail image and extract the following metadata in JSON format:

{
  "subjectPosition": "left|center|right|top|bottom",
  "textPosition": "top|bottom|overlay|side",
  "textAlignment": "left|center|right",
  "colorPalette": ["color1", "color2", "color3"],
  "lighting": "dramatic|soft|bright|dim|natural",
  "contrast": "high|medium|low",
  "mood": "shocked|excited|curious|angry|happy|sad|confused",
  "emotionalExpression": "shocked|happy|excited|surprised|confused|skeptical",
  "hasText": true|false,
  "textStyle": "bold|outline|shadow|3d|simple",
  "hasFace": true|false,
  "faceExpression": "shocked|happy|excited|surprised|confused|skeptical",
  "hasProduct": true|false,
  "layerCount": number,
  "symmetry": "symmetric|asymmetric|balanced",
  "depthOfField": "shallow|deep|medium",
  "extractedPrompt": "detailed description for DALL-E 3",
  "confidence": 0.0-1.0
}

Be precise and return ONLY valid JSON.`;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(imageUrl),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const metadata = JSON.parse(jsonMatch[0]) as ThumbnailMetadataExtracted;
    return metadata;
  } catch (error) {
    console.error('Error analyzing thumbnail with Gemini Vision:', error);
    throw new Error('Failed to analyze thumbnail image');
  }
}

/**
 * Analyze user prompt to extract required elements
 */
export async function analyzeUserPrompt(
  userPrompt: string,
  uploadedImages?: string[]
): Promise<Partial<ThumbnailMetadataExtracted>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    let prompt = `Analyze this YouTube thumbnail generation request and extract the following metadata:

User Request: "${userPrompt}"

Extract and return as JSON:
{
  "mood": "shocked|excited|curious|angry|happy|sad|confused",
  "emotionalExpression": "shocked|happy|excited|surprised|confused|skeptical",
  "subjectPosition": "left|center|right|top|bottom",
  "textPosition": "top|bottom|overlay|side",
  "lighting": "dramatic|soft|bright|dim|natural",
  "contrast": "high|medium|low",
  "hasFace": true|false,
  "hasProduct": true|false,
  "colorPreferences": ["color1", "color2"],
  "stylePreferences": "minimalist|colorful|dramatic|professional|casual"
}

Return ONLY valid JSON.`;

    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    // Add uploaded images if available
    if (uploadedImages && uploadedImages.length > 0) {
      for (const imageUrl of uploadedImages) {
        contents[0].parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: await fetchImageAsBase64(imageUrl),
          },
        });
      }
    }

    const response = await model.generateContent({
      contents,
    });

    const responseText = response.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const metadata = JSON.parse(jsonMatch[0]) as Partial<ThumbnailMetadataExtracted>;
    return metadata;
  } catch (error) {
    console.error('Error analyzing user prompt:', error);
    throw new Error('Failed to analyze user prompt');
  }
}

/**
 * Compare two thumbnails and identify similarities
 */
export async function compareThumbnails(
  referenceImageUrl: string,
  generatedImageUrl: string
): Promise<{
  similarityScore: number;
  matchingElements: string[];
  differences: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Compare these two YouTube thumbnails and identify:
1. Similarity score (0-1)
2. Matching visual elements
3. Key differences

Return as JSON:
{
  "similarityScore": 0.0-1.0,
  "matchingElements": ["element1", "element2"],
  "differences": ["difference1", "difference2"]
}`;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(referenceImageUrl),
              },
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(generatedImageUrl),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error comparing thumbnails:', error);
    throw new Error('Failed to compare thumbnails');
  }
}

/**
 * Generate quality assessment for a generated thumbnail
 */
export async function assessThumbnailQuality(
  generatedImageUrl: string,
  referenceMetadata?: ThumbnailMetadataExtracted
): Promise<{
  qualityScore: number;
  strengths: string[];
  improvements: string[];
  viralPotential: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    let prompt = `Assess the quality of this YouTube thumbnail for viral potential.

Evaluate:
1. Visual impact and attention-grabbing elements
2. Text readability and clarity
3. Color contrast and appeal
4. Emotional engagement
5. Composition and balance
6. Overall viral potential (0-1)

Return as JSON:
{
  "qualityScore": 0.0-1.0,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "viralPotential": 0.0-1.0
}`;

    if (referenceMetadata) {
      prompt += `\n\nReference metadata for comparison:
${JSON.stringify(referenceMetadata, null, 2)}`;
    }

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(generatedImageUrl),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error assessing thumbnail quality:', error);
    throw new Error('Failed to assess thumbnail quality');
  }
}

/**
 * Fetch image from URL and convert to base64
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch image');
  }
}



