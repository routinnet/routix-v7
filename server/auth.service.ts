// Authentication Service for Routix
import { invokeLLM } from "./_core/llm";

export interface EmailVerificationToken {
  token: string;
  userId: string;
  expiresAt: Date;
  verified: boolean;
}

export interface TwoFactorSecret {
  userId: string;
  secret: string;
  qrCode: string;
  enabled: boolean;
  backupCodes: string[];
}

export interface LoginLog {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed";
  method: "password" | "oauth" | "2fa";
}

export interface SocialLoginProvider {
  provider: "google" | "github" | "discord";
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

const emailTokens: Map<string, EmailVerificationToken> = new Map();
const twoFactorSecrets: Map<string, TwoFactorSecret> = new Map();
const loginLogs: LoginLog[] = [];
const ipWhitelist: Set<string> = new Set();
const ipBlacklist: Set<string> = new Set();

// Email Verification
export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  emailTokens.set(token, {
    token,
    userId,
    expiresAt,
    verified: false,
  });

  return token;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const verification = emailTokens.get(token);

  if (!verification || verification.expiresAt < new Date()) {
    return false;
  }

  verification.verified = true;
  return true;
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  for (const verification of emailTokens.values()) {
    if (verification.userId === userId && verification.verified) {
      return true;
    }
  }
  return false;
}

// Two-Factor Authentication
export async function generateTwoFactorSecret(userId: string): Promise<TwoFactorSecret> {
  const secret = Math.random().toString(36).substring(2, 15);
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  const twoFactorSecret: TwoFactorSecret = {
    userId,
    secret,
    qrCode: `otpauth://totp/Routix:${userId}?secret=${secret}`,
    enabled: false,
    backupCodes,
  };

  twoFactorSecrets.set(userId, twoFactorSecret);
  return twoFactorSecret;
}

export async function enableTwoFactor(userId: string, code: string): Promise<boolean> {
  const secret = twoFactorSecrets.get(userId);
  if (!secret) return false;

  // In production, verify the TOTP code
  secret.enabled = true;
  return true;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  const secret = twoFactorSecrets.get(userId);
  if (secret) {
    secret.enabled = false;
  }
}

export async function verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
  const secret = twoFactorSecrets.get(userId);
  if (!secret || !secret.enabled) return false;

  // In production, verify the TOTP code using a library like speakeasy
  // For now, accept any 6-digit code
  return /^\d{6}$/.test(code);
}

// Login Activity Logging
export async function logLogin(
  userId: string,
  ipAddress: string,
  userAgent: string,
  method: "password" | "oauth" | "2fa",
  status: "success" | "failed"
): Promise<void> {
  const log: LoginLog = {
    id: `login-${Date.now()}`,
    userId,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    status,
    method,
  };

  loginLogs.push(log);

  // Check for suspicious activity
  if (status === "failed") {
    const recentFailures = loginLogs.filter(
      (l) => l.userId === userId && l.status === "failed" &&
      Date.now() - l.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailures.length >= 5) {
      // Add IP to blacklist
      ipBlacklist.add(ipAddress);
    }
  }
}

export async function getLoginHistory(userId: string, limit: number = 20): Promise<LoginLog[]> {
  return loginLogs
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// IP Security
export async function addIpToWhitelist(userId: string, ipAddress: string): Promise<void> {
  ipWhitelist.add(ipAddress);
}

export async function removeIpFromWhitelist(ipAddress: string): Promise<void> {
  ipWhitelist.delete(ipAddress);
}

export async function isIpBlacklisted(ipAddress: string): Promise<boolean> {
  return ipBlacklist.has(ipAddress);
}

export async function isIpWhitelisted(ipAddress: string): Promise<boolean> {
  return ipWhitelist.has(ipAddress);
}

// Social Login
export async function handleSocialLogin(provider: SocialLoginProvider): Promise<any> {
  // In production, verify the provider token and create/update user
  return {
    provider: provider.provider,
    email: provider.email,
    name: provider.name,
    avatar: provider.avatar,
  };
}

// Session Management
export async function createSession(userId: string, ipAddress: string): Promise<string> {
  const sessionId = Math.random().toString(36).substring(2, 15);
  // In production, store in Redis with TTL
  return sessionId;
}

export async function validateSession(sessionId: string): Promise<string | null> {
  // In production, check Redis
  return sessionId ? "userId" : null;
}

export async function revokeSession(sessionId: string): Promise<void> {
  // In production, delete from Redis
}

export default {
  generateEmailVerificationToken,
  verifyEmailToken,
  isEmailVerified,
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorCode,
  logLogin,
  getLoginHistory,
  addIpToWhitelist,
  removeIpFromWhitelist,
  isIpBlacklisted,
  isIpWhitelisted,
  handleSocialLogin,
  createSession,
  validateSession,
  revokeSession,
};
