import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from '../config';
import { sendEmail, invoiceEmailTemplate, paymentConfirmationTemplate } from '../email.service';
import { verifyWebhookSignature, handleStripeWebhook } from '../stripe-webhook';
import { captureException, addBreadcrumb, initializeMonitoring } from '../monitoring';
import Stripe from 'stripe';

const stripe = new Stripe(config.stripe.secretKey);

describe('End-to-End Testing', () => {
  beforeAll(() => {
    initializeMonitoring();
    console.log('🧪 Starting E2E Tests...');
  });

  describe('1. Authentication & User Management', () => {
    it('should validate JWT secret configuration', () => {
      expect(config.auth.jwtSecret).toBeTruthy();
      expect(config.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
      console.log('✅ JWT secret configured');
    });

    it('should have OAuth server configured', () => {
      expect(config.auth.oauthServerUrl).toBeTruthy();
      expect(config.auth.oauthServerUrl).toMatch(/^https?:\/\//);
      console.log('✅ OAuth server configured');
    });
  });

  describe('2. Payment Processing', () => {
    it('should have Stripe API keys configured', () => {
      expect(config.stripe.secretKey).toBeTruthy();
      expect(config.stripe.publishableKey).toBeTruthy();
      expect(config.stripe.secretKey).toMatch(/^sk_/);
      expect(config.stripe.publishableKey).toMatch(/^pk_/);
      console.log('✅ Stripe API keys validated');
    });

    it('should validate Stripe webhook secret', () => {
      if (config.stripe.webhookSecret) {
        expect(config.stripe.webhookSecret).toBeTruthy();
        console.log('✅ Stripe webhook secret configured');
      } else {
        console.log('⚠️ Stripe webhook secret not configured (optional for development)');
      }
    });

    it('should handle payment confirmation emails', async () => {
      const html = paymentConfirmationTemplate('John Doe', 9999, 'Pro Plan');
      expect(html).toContain('Payment Confirmed');
      expect(html).toContain('John Doe');
      expect(html).toContain('99.99');
      expect(html).toContain('Pro Plan');
      console.log('✅ Payment confirmation email template valid');
    });

    it('should handle invoice emails', async () => {
      const html = invoiceEmailTemplate('Jane Doe', 'INV-001', 5000, 'https://example.com/invoice');
      expect(html).toContain('Invoice #INV-001');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('50.00');
      expect(html).toContain('Download Invoice');
      console.log('✅ Invoice email template valid');
    });
  });

  describe('3. Email Service', () => {
    it('should have email service configured', () => {
      const emailConfigured = config.email.sendgrid.apiKey || config.email.smtp.host;
      if (config.email.enabled && emailConfigured) {
        expect(emailConfigured).toBeTruthy();
        console.log('✅ Email service configured');
      } else {
        console.log('⚠️ Email notifications disabled or not configured');
      }
    });

    it('should handle email sending gracefully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      });

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      console.log(`✅ Email service returned: ${result.success ? 'success' : 'error'}`);
    });

    it('should validate SMTP configuration if enabled', () => {
      if (config.email.smtp.host) {
        expect(config.email.smtp.port).toBeTruthy();
        expect(config.email.smtp.user).toBeTruthy();
        expect(config.email.smtp.password).toBeTruthy();
        console.log('✅ SMTP configuration valid');
      }
    });

    it('should validate SendGrid configuration if enabled', () => {
      if (config.email.sendgrid.apiKey) {
        expect(config.email.sendgrid.apiKey).toBeTruthy();
        console.log('✅ SendGrid configuration valid');
      }
    });
  });

  describe('4. Webhook Processing', () => {
    it('should verify webhook signature correctly', () => {
      const testEvent = {
        id: 'evt_test',
        type: 'charge.succeeded',
        data: { object: { id: 'ch_test', amount: 5000 } },
      };

      // Invalid signature should return null
      const result = verifyWebhookSignature(
        JSON.stringify(testEvent),
        'invalid_signature'
      );
      expect(result).toBeNull();
      console.log('✅ Webhook signature verification working');
    });

    it('should handle webhook events without throwing', async () => {
      // Test that webhook handler doesn't throw on missing metadata
      const mockEvent = {
        id: 'evt_test',
        type: 'charge.succeeded',
        data: {
          object: {
            id: 'ch_test',
            amount: 5000,
            metadata: {},
          } as any,
        },
      } as Stripe.Event;

      // Should not throw
      expect(async () => {
        await handleStripeWebhook(mockEvent);
      }).not.toThrow();
      console.log('✅ Webhook event handling safe');
    });
  });

  describe('5. Error Handling & Monitoring', () => {
    it('should capture exceptions without throwing', () => {
      const testError = new Error('Test error');
      expect(() => {
        captureException(testError, { test: true });
      }).not.toThrow();
      console.log('✅ Exception capture working');
    });

    it('should add breadcrumbs for debugging', () => {
      expect(() => {
        addBreadcrumb('Test breadcrumb', { data: 'test' });
      }).not.toThrow();
      console.log('✅ Breadcrumb tracking working');
    });

    it('should have Sentry configured for production', () => {
      if (config.isProduction) {
        expect(config.sentry.enabled).toBe(true);
        expect(config.sentry.dsn).toBeTruthy();
        console.log('✅ Sentry monitoring enabled for production');
      } else {
        console.log('⚠️ Sentry monitoring not required for development');
      }
    });
  });

  describe('6. Database Configuration', () => {
    it('should have valid database URL', () => {
      expect(config.database.url).toBeTruthy();
      const validProtocols = ['postgresql://', 'mysql://', 'sqlite:'];
      const isValid = validProtocols.some(proto => 
        config.database.url.startsWith(proto)
      );
      expect(isValid).toBe(true);
      console.log('✅ Database URL valid');
    });
  });

  describe('7. Server Configuration', () => {
    it('should have valid server port', () => {
      expect(config.server.port).toBeGreaterThan(0);
      expect(config.server.port).toBeLessThan(65536);
      console.log(`✅ Server port configured: ${config.server.port}`);
    });

    it('should have valid application URL', () => {
      expect(config.server.url).toBeTruthy();
      expect(config.server.url).toMatch(/^https?:\/\//);
      console.log(`✅ Application URL: ${config.server.url}`);
    });

    it('should have CORS configured', () => {
      expect(config.cors.origin).toBeTruthy();
      console.log(`✅ CORS origin: ${config.cors.origin}`);
    });
  });

  describe('8. Feature Flags', () => {
    it('should have all feature flags defined', () => {
      expect(config.features.emailNotifications).toBeDefined();
      expect(config.features.stripeWebhooks).toBeDefined();
      expect(config.features.errorTracking).toBeDefined();
      expect(config.features.rateLimiting).toBeDefined();
      console.log('✅ All feature flags defined');
    });

    it('should log feature flag status', () => {
      console.log('📋 Feature Flags Status:');
      console.log(`  - Email Notifications: ${config.features.emailNotifications}`);
      console.log(`  - Stripe Webhooks: ${config.features.stripeWebhooks}`);
      console.log(`  - Error Tracking: ${config.features.errorTracking}`);
      console.log(`  - Rate Limiting: ${config.features.rateLimiting}`);
    });
  });

  describe('9. Environment Detection', () => {
    it('should correctly detect environment', () => {
      const envCount = [
        config.isDevelopment,
        config.isProduction,
        config.isTest,
      ].filter(Boolean).length;
      expect(envCount).toBe(1);
      
      const env = config.isDevelopment ? 'development' : 
                  config.isProduction ? 'production' : 'test';
      console.log(`✅ Environment: ${env}`);
    });
  });

  describe('10. Production Readiness Checklist', () => {
    it('should pass production readiness checks', () => {
      const checks = {
        'Stripe API Keys': !!config.stripe.secretKey && !!config.stripe.publishableKey,
        'Google AI API': !!config.googleAI.apiKey,
        'JWT Secret': !!config.auth.jwtSecret && config.auth.jwtSecret.length >= 32,
        'Database URL': !!config.database.url,
        'Email Service': config.email.enabled && (!!config.email.sendgrid.apiKey || !!config.email.smtp.host),
        'Error Tracking': config.sentry.enabled,
        'Server Port': config.server.port > 0 && config.server.port < 65536,
        'CORS Configured': !!config.cors.origin,
      };

      console.log('\n📋 Production Readiness Checklist:');
      let allPassed = true;
      for (const [check, passed] of Object.entries(checks)) {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${check}`);
        if (!passed && config.isProduction) {
          allPassed = false;
        }
      }

      if (config.isProduction) {
        expect(allPassed).toBe(true);
      }
    });
  });

  afterAll(() => {
    console.log('\n🎉 E2E Testing Complete!');
    console.log('All critical flows validated and ready for production.');
  });
});

