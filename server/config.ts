import { z } from 'zod';

/**
 * Environment Variables Schema
 * Validates and types all environment variables
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32).optional(),
  OAUTH_SERVER_URL: z.string().url().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Google Generative AI
  GOOGLE_API_KEY: z.string().optional(),
  
  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(v => v ? Number(v) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  
  // Error Tracking
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  
  // Storage
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  
  // Redis (optional caching)
  REDIS_URL: z.string().url().optional(),
  
  // Application
  APP_NAME: z.string().default('Routix'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Feature flags
  ENABLE_EMAIL_NOTIFICATIONS: z.string().default('true'),
  ENABLE_STRIPE_WEBHOOKS: z.string().default('true'),
  ENABLE_ERROR_TRACKING: z.string().default('true'),
  ENABLE_RATE_LIMITING: z.string().default('true'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('⚠️ Environment validation issues detected');
    }
    throw error;
  }
}

// Parse environment on module load
let env: Env;
try {
  env = parseEnv();
} catch (error) {
  console.warn('⚠️ Using default configuration for testing');
  env = {
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: 'localhost',
    DATABASE_URL: 'postgresql://localhost/routix',
    JWT_SECRET: 'test-secret-key-at-least-32-characters-long-for-testing',
    OAUTH_SERVER_URL: 'http://localhost:3001',
    STRIPE_SECRET_KEY: 'sk_test_123456789',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123456789',
    STRIPE_WEBHOOK_SECRET: undefined,
    GOOGLE_API_KEY: 'test-api-key',
    SMTP_HOST: undefined,
    SMTP_PORT: undefined,
    SMTP_USER: undefined,
    SMTP_PASSWORD: undefined,
    SMTP_FROM: undefined,
    SENDGRID_API_KEY: undefined,
    SENTRY_DSN: undefined,
    SENTRY_ENVIRONMENT: 'development',
    S3_BUCKET: undefined,
    S3_REGION: undefined,
    S3_ACCESS_KEY: undefined,
    S3_SECRET_KEY: undefined,
    REDIS_URL: undefined,
    APP_NAME: 'Routix',
    APP_URL: 'http://localhost:3000',
    CORS_ORIGIN: 'http://localhost:3000',
    ENABLE_EMAIL_NOTIFICATIONS: 'true',
    ENABLE_STRIPE_WEBHOOKS: 'true',
    ENABLE_ERROR_TRACKING: 'true',
    ENABLE_RATE_LIMITING: 'true',
  } as Env;
}

export { env };

/**
 * Configuration object for different environments
 */
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    url: env.APP_URL,
  },
  
  // Database
  database: {
    url: env.DATABASE_URL || 'postgresql://localhost/routix',
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET || 'test-secret-key-at-least-32-characters-long-for-testing',
    oauthServerUrl: env.OAUTH_SERVER_URL || 'http://localhost:3001',
  },
  
  // Stripe
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY || 'sk_test_123456789',
    publishableKey: env.STRIPE_PUBLISHABLE_KEY || 'pk_test_123456789',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Google AI
  googleAI: {
    apiKey: env.GOOGLE_API_KEY || 'test-api-key',
  },
  
  // Email
  email: {
    enabled: env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.SMTP_FROM,
    },
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
    },
  },
  
  // Error tracking
  sentry: {
    enabled: env.ENABLE_ERROR_TRACKING === 'true',
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  },
  
  // Storage
  storage: {
    s3: {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
    },
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
  },
  
  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
  },
  
  // Feature flags
  features: {
    emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    stripeWebhooks: env.ENABLE_STRIPE_WEBHOOKS === 'true',
    errorTracking: env.ENABLE_ERROR_TRACKING === 'true',
    rateLimiting: env.ENABLE_RATE_LIMITING === 'true',
  },
};

export default config;

