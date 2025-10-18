import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from '../config';
import { sendEmail } from '../email.service';
import { verifyWebhookSignature } from '../stripe-webhook';
import { initializeMonitoring, captureException } from '../monitoring';

describe('Critical Production Flows', () => {
  beforeAll(() => {
    // Initialize monitoring
    initializeMonitoring();
  });

  describe('Email Service', () => {
    it('should validate email configuration', () => {
      expect(config.email.enabled).toBeDefined();
      // Email service should be configured for production
      if (config.isProduction) {
        expect(
          config.email.sendgrid.apiKey || config.email.smtp.host
        ).toBeTruthy();
      }
    });

    it('should handle email sending gracefully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      });

      // Should return success or error, not throw
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Configuration Management', () => {
    it('should have all required environment variables', () => {
      expect(config.stripe.secretKey).toBeTruthy();
      expect(config.googleAI.apiKey).toBeTruthy();
      expect(config.auth.jwtSecret).toBeTruthy();
    });

    it('should have correct environment detection', () => {
      const envCount = [
        config.isDevelopment,
        config.isProduction,
        config.isTest,
      ].filter(Boolean).length;
      expect(envCount).toBe(1);
    });

    it('should have feature flags configured', () => {
      expect(config.features).toBeDefined();
      expect(config.features.emailNotifications).toBeDefined();
      expect(config.features.stripeWebhooks).toBeDefined();
    });
  });

  describe('Error Monitoring', () => {
    it('should capture exceptions without throwing', () => {
      const testError = new Error('Test error');
      expect(() => {
        captureException(testError, { test: true });
      }).not.toThrow();
    });

    it('should handle monitoring gracefully when disabled', () => {
      // Should not throw even if monitoring is disabled
      expect(() => {
        captureException(new Error('Test'), {});
      }).not.toThrow();
    });
  });

  describe('Stripe Integration', () => {
    it('should have Stripe keys configured', () => {
      expect(config.stripe.secretKey).toBeTruthy();
      expect(config.stripe.publishableKey).toBeTruthy();
    });

    it('should validate Stripe key format', () => {
      expect(config.stripe.secretKey).toMatch(/^sk_/);
      expect(config.stripe.publishableKey).toMatch(/^pk_/);
    });

    it('should handle webhook signature verification', () => {
      const invalidSignature = 'invalid_signature';
      const body = JSON.stringify({ test: true });

      // Should return null for invalid signature
      const result = verifyWebhookSignature(body, invalidSignature);
      expect(result).toBeNull();
    });
  });

  describe('Database Connection', () => {
    it('should have database URL configured', () => {
      expect(config.database.url).toBeTruthy();
      expect(config.database.url).toMatch(/^(postgres|mysql|sqlite):/);
    });
  });

  describe('Server Configuration', () => {
    it('should have valid server configuration', () => {
      expect(config.server.port).toBeGreaterThan(0);
      expect(config.server.port).toBeLessThan(65536);
      expect(config.server.url).toBeTruthy();
    });

    it('should have CORS configuration', () => {
      expect(config.cors.origin).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    it('should have JWT secret configured', () => {
      expect(config.auth.jwtSecret).toBeTruthy();
      expect(config.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should have OAuth server URL configured', () => {
      expect(config.auth.oauthServerUrl).toBeTruthy();
    });
  });

  describe('Feature Flags', () => {
    it('should have all feature flags defined', () => {
      expect(config.features.emailNotifications).toBeDefined();
      expect(config.features.stripeWebhooks).toBeDefined();
      expect(config.features.errorTracking).toBeDefined();
      expect(config.features.rateLimiting).toBeDefined();
    });

    it('should have boolean feature flags', () => {
      expect(typeof config.features.emailNotifications).toBe('boolean');
      expect(typeof config.features.stripeWebhooks).toBe('boolean');
      expect(typeof config.features.errorTracking).toBe('boolean');
      expect(typeof config.features.rateLimiting).toBe('boolean');
    });
  });

  describe('Production Readiness', () => {
    it('should be properly configured for production', () => {
      if (config.isProduction) {
        // Production checks
        expect(config.sentry.enabled).toBe(true);
        expect(config.sentry.dsn).toBeTruthy();
        expect(config.features.errorTracking).toBe(true);
      }
    });

    it('should have secure defaults', () => {
      expect(config.auth.jwtSecret).toBeTruthy();
      expect(config.stripe.secretKey).toBeTruthy();
    });
  });
});

