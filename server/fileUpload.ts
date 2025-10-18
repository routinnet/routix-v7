/**
 * File Upload Handler
 * Handles image uploads for chat and thumbnail generation
 */

import { storagePut, storageGet } from "./storage";

export interface UploadedFile {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Upload image file to S3
 */
export async function uploadImageToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadedFile> {
  try {
    // Generate unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const key = `uploads/${timestamp}-${random}-${fileName}`;

    // Upload to S3
    const { url } = await storagePut(key, fileBuffer, mimeType);

    return {
      key,
      url,
      fileName,
      mimeType,
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error("[FileUpload] Failed to upload file:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Get presigned URL for uploaded file
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { url } = await storageGet(key, expiresIn);
    return url;
  } catch (error) {
    console.error("[FileUpload] Failed to get presigned URL:", error);
    throw new Error("Failed to get file URL");
  }
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: {
    mimetype: string;
    size: number;
  },
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, WebP, and GIF images are allowed",
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Process uploaded image for thumbnail generation
 */
export async function processImageForGeneration(
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadedFile> {
  // Validate
  const validation = validateImageFile({
    mimetype: "image/jpeg",
    size: fileBuffer.length,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload to S3
  return await uploadImageToS3(fileBuffer, fileName, "image/jpeg");
}

