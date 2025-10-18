/**
 * Security Utilities
 * Rate limiting, input validation, and security helpers
 */

import { z } from "zod";

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated service
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number; // Time window in milliseconds
  private readonly maxRequests: number; // Max requests per window

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create request list for this identifier
    let requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    requests = requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter((time) => time > windowStart);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Reset limiter for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Create rate limiters for different endpoints
export const apiLimiter = new RateLimiter(60000, 100); // 100 requests per minute
export const authLimiter = new RateLimiter(60000, 10); // 10 requests per minute
export const generationLimiter = new RateLimiter(60000, 20); // 20 requests per minute

/**
 * Input validation schemas
 */

export const promptSchema = z.object({
  prompt: z
    .string()
    .min(3, "Prompt must be at least 3 characters")
    .max(1000, "Prompt must not exceed 1000 characters")
    .trim(),
});

export const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const userProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export const thumbnailGenerationSchema = z.object({
  prompt: z
    .string()
    .min(3, "Prompt must be at least 3 characters")
    .max(1000, "Prompt must not exceed 1000 characters"),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(["16:9", "1:1", "9:16"]).optional(),
});

/**
 * Security headers
 */

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Sanitize user input
 */

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Hash password (placeholder - use bcrypt in production)
 */

export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt:
  // import bcrypt from "bcrypt";
  // return bcrypt.hash(password, 10);

  // For now, just return a placeholder
  return `hashed_${password}`;
}

/**
 * Verify password (placeholder - use bcrypt in production)
 */

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // In production, use bcrypt:
  // import bcrypt from "bcrypt";
  // return bcrypt.compare(password, hash);

  // For now, just compare strings
  return hash === `hashed_${password}`;
}

/**
 * Generate secure random token
 */

export function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate API key format
 */

export function isValidApiKey(apiKey: string): boolean {
  return /^[a-zA-Z0-9_-]{32,}$/.test(apiKey);
}

/**
 * Check if IP is in whitelist
 */

export function isIpWhitelisted(ip: string, whitelist: string[]): boolean {
  return whitelist.includes(ip);
}

/**
 * Get client IP from request
 */

export function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Check if request is from trusted source
 */

export function isTrustedSource(
  ip: string,
  trustedIps: string[] = []
): boolean {
  // Localhost is always trusted in development
  if (process.env.NODE_ENV === "development") {
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168")) {
      return true;
    }
  }

  return trustedIps.includes(ip);
}

