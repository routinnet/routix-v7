/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly messages
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_DELETED: "RESOURCE_DELETED",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",

  // Credit errors
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  CREDIT_PURCHASE_FAILED: "CREDIT_PURCHASE_FAILED",

  // Generation errors
  GENERATION_FAILED: "GENERATION_FAILED",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
  INVALID_PROMPT: "INVALID_PROMPT",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",

  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
} as const;

/**
 * User-friendly error messages
 */
export const ErrorMessages: Record<string, string> = {
  // Auth
  [ErrorCodes.UNAUTHORIZED]: "You need to be logged in to perform this action",
  [ErrorCodes.FORBIDDEN]: "You don't have permission to access this resource",
  [ErrorCodes.SESSION_EXPIRED]: "Your session has expired. Please log in again",
  [ErrorCodes.INVALID_CREDENTIALS]: "Invalid email or password",

  // Validation
  [ErrorCodes.INVALID_INPUT]: "Please check your input and try again",
  [ErrorCodes.MISSING_REQUIRED_FIELD]: "Please fill in all required fields",
  [ErrorCodes.INVALID_EMAIL]: "Please enter a valid email address",
  [ErrorCodes.WEAK_PASSWORD]: "Password must be at least 8 characters with uppercase, lowercase, and numbers",

  // Resources
  [ErrorCodes.NOT_FOUND]: "The requested resource was not found",
  [ErrorCodes.RESOURCE_DELETED]: "This resource has been deleted",
  [ErrorCodes.DUPLICATE_RESOURCE]: "This resource already exists",

  // Credits
  [ErrorCodes.INSUFFICIENT_CREDITS]: "You don't have enough credits for this action",
  [ErrorCodes.CREDIT_PURCHASE_FAILED]: "Failed to process your credit purchase. Please try again",

  // Generation
  [ErrorCodes.GENERATION_FAILED]: "Failed to generate thumbnail. Please try again with a different prompt",
  [ErrorCodes.GENERATION_TIMEOUT]: "Generation took too long. Please try again",
  [ErrorCodes.INVALID_PROMPT]: "Please provide a more specific prompt",

  // Server
  [ErrorCodes.INTERNAL_ERROR]: "An unexpected error occurred. Please try again later",
  [ErrorCodes.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable. Please try again later",
  [ErrorCodes.RATE_LIMITED]: "Too many requests. Please wait a moment and try again",

  // Network
  [ErrorCodes.NETWORK_ERROR]: "Network error. Please check your connection",
  [ErrorCodes.REQUEST_TIMEOUT]: "Request timed out. Please try again",
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ErrorMessages[error.code] || error.message;
  }

  if (error instanceof Error) {
    // Check if it's a tRPC error
    if ("data" in error && typeof error.data === "object") {
      const data = error.data as any;
      if (data.code) {
        return ErrorMessages[data.code] || error.message;
      }
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Handle tRPC errors
 */
export function handleTRPCError(error: unknown): {
  code: string;
  message: string;
  details?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: ErrorMessages[error.code] || error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Parse tRPC error format
    const message = error.message;
    const match = message.match(/\[(\w+)\]/);
    const code = match ? match[1] : "INTERNAL_ERROR";

    return {
      code,
      message: ErrorMessages[code] || message,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: ErrorMessages[ErrorCodes.INTERNAL_ERROR],
  };
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate prompt
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    errors.push("Prompt cannot be empty");
  }
  if (trimmed.length < 3) {
    errors.push("Prompt must be at least 3 characters");
  }
  if (trimmed.length > 1000) {
    errors.push("Prompt must not exceed 1000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Log error to service (Sentry, LogRocket, etc.)
 */
export function logError(
  error: unknown,
  context?: Record<string, any>
): void {
  const errorInfo = {
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
  };

  console.error("[Error Log]", errorInfo);

  // TODO: Send to error tracking service
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

