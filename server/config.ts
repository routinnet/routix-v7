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
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  OAUTH_SERVER_URL: z.string().url('Invalid OAuth server URL'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Google Generative AI
  GOOGLE_API_KEY: z.string().min(20, 'Invalid Google API key'),
  
  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(v => v ? Number(v) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email('Invalid SMTP from email').optional(),
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
  APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
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
      const missingVars = (error as any).errors
        .filter((e: any) => e.code === 'invalid_type')
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join('\n');
      
      console.error('❌ Invalid environment variables:\n', missingVars);
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

// Parse environment on module load
export const env = parseEnv();

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
    url: env.DATABASE_URL,
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    oauthServerUrl: env.OAUTH_SERVER_URL,
  },
  
  // Stripe
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Google AI
  googleAI: {
    apiKey: env.GOOGLE_API_KEY,
  },
  
  // Email
  email: {
    enabled: env.ENABLE_EMAIL_NOTIFICATIONS,
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
    enabled: env.ENABLE_ERROR_TRACKING,
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
    emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
    stripeWebhooks: env.ENABLE_STRIPE_WEBHOOKS,
    errorTracking: env.ENABLE_ERROR_TRACKING,
    rateLimiting: env.ENABLE_RATE_LIMITING,
  },
};

export default config;

