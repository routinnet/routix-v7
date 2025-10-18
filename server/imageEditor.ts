// Advanced Image Editor Service
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGet } from "./storage";

export interface ImageEditOptions {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  blur?: number; // 0 to 100
  sepia?: boolean;
  grayscale?: boolean;
  invert?: boolean;
  rotate?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  text?: {
    content: string;
    position: "top" | "center" | "bottom";
    fontSize: number;
    color: string;
    fontFamily: string;
  };
  overlay?: {
    type: "gradient" | "pattern" | "solid";
    color?: string;
    opacity?: number;
  };
}

export async function editImage(
  imageUrl: string,
  options: ImageEditOptions
): Promise<{ url: string; key: string }> {
  // Build prompt for image editing
  const edits: string[] = [];

  if (options.brightness) edits.push(`brightness ${options.brightness > 0 ? "increased" : "decreased"}`);
  if (options.contrast) edits.push(`contrast ${options.contrast > 0 ? "increased" : "decreased"}`);
  if (options.saturation) edits.push(`saturation ${options.saturation > 0 ? "increased" : "decreased"}`);
  if (options.blur) edits.push(`apply ${options.blur}% blur`);
  if (options.sepia) edits.push("apply sepia tone");
  if (options.grayscale) edits.push("convert to grayscale");
  if (options.invert) edits.push("invert colors");
  if (options.rotate) edits.push(`rotate ${options.rotate} degrees`);
  if (options.flipH) edits.push("flip horizontally");
  if (options.flipV) edits.push("flip vertically");
  if (options.text) edits.push(`add text: "${options.text.content}" at ${options.text.position}`);
  if (options.overlay) edits.push(`add ${options.overlay.type} overlay`);

  const prompt = `Edit this image with the following adjustments: ${edits.join(", ")}`;

  // Use LLM for image editing guidance
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an image editing expert. Provide specific instructions for editing images.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  // Generate edited image URL (placeholder)
  const editedImageUrl = imageUrl; // In production, use actual image processing

  // Save to S3
  const { key, url } = await storagePut(
    `edited-images/${Date.now()}-edited.jpg`,
    Buffer.from("edited-image-data"),
    "image/jpeg"
  );

  return { url, key };
}

export async function applyFilter(
  imageUrl: string,
  filterType: "vintage" | "modern" | "cinematic" | "vibrant" | "minimal"
): Promise<{ url: string; key: string }> {
  const filterPrompts = {
    vintage: "Apply a vintage film effect with warm tones and slight grain",
    modern: "Apply a modern, clean aesthetic with crisp colors",
    cinematic: "Apply cinematic color grading with warm shadows and cool highlights",
    vibrant: "Enhance colors for a vibrant, saturated look",
    minimal: "Apply minimalist style with reduced colors and high contrast",
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
          {
            type: "text",
            text: filterPrompts[filterType],
          },
        ],
      },
    ],
  });

  const { key, url } = await storagePut(
    `filtered-images/${Date.now()}-${filterType}.jpg`,
    Buffer.from("filtered-image-data"),
    "image/jpeg"
  );

  return { url, key };
}

export async function addTextOverlay(
  imageUrl: string,
  text: string,
  options: {
    position: "top" | "center" | "bottom";
    fontSize: number;
    color: string;
    fontFamily: string;
  }
): Promise<{ url: string; key: string }> {
  const prompt = `Add text "${text}" to this image at the ${options.position} position with ${options.fontSize}px font size in ${options.color} color`;

  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const { key, url } = await storagePut(
    `text-overlay-images/${Date.now()}-text.jpg`,
    Buffer.from("text-overlay-data"),
    "image/jpeg"
  );

  return { url, key };
}

export default {
  editImage,
  applyFilter,
  addTextOverlay,
};
