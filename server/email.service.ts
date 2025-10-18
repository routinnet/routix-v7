import nodemailer from 'nodemailer';
import { config } from './config';

/**
 * Email Service
 * Handles sending emails via SMTP or SendGrid
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (transporter) return transporter;

  if (config.email.sendgrid.apiKey) {
    // Use SendGrid
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: config.email.sendgrid.apiKey,
      },
    });
  } else if (config.email.smtp.host) {
    // Use SMTP
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port || 587,
      secure: (config.email.smtp.port || 587) === 465,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.password,
      },
    });
  } else {
    console.warn('⚠️ No email service configured. Emails will not be sent.');
    return null;
  }

  return transporter;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!config.email.enabled) {
    console.log('📧 Email notifications disabled');
    return { success: true };
  }

  try {
    const emailTransporter = initializeTransporter();
    if (!emailTransporter) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const result = await emailTransporter.sendMail({
      from: options.from || config.email.smtp.from || 'noreply@routix.app',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Email templates
 */

export function invoiceEmailTemplate(
  userName: string,
  invoiceId: string,
  amount: number,
  downloadUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
          .button { background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice #${invoiceId}</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for your purchase! Your invoice is ready.</p>
            <p><strong>Amount: $${(amount / 100).toFixed(2)}</strong></p>
            <p>
              <a href="${downloadUrl}" class="button">Download Invoice</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 Routix. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function paymentConfirmationTemplate(
  userName: string,
  amount: number,
  planName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
          .success { color: #27ae60; font-weight: bold; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p class="success">Your payment has been successfully processed!</p>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
            <p>You can now start generating amazing thumbnails with Routix.</p>
          </div>
          <div class="footer">
            <p>© 2024 Routix. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function referralBonusTemplate(
  userName: string,
  referrerName: string,
  bonusCredits: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
          .bonus { color: #f5576c; font-weight: bold; font-size: 18px; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Referral Bonus!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Great news! ${referrerName} joined Routix using your referral link.</p>
            <p class="bonus">You've earned ${bonusCredits} bonus credits!</p>
            <p>These credits are now available in your account and can be used to generate more thumbnails.</p>
          </div>
          <div class="footer">
            <p>© 2024 Routix. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function subscriptionRenewalTemplate(
  userName: string,
  planName: string,
  renewalDate: Date
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your ${planName} subscription will renew on ${renewalDate.toLocaleDateString()}.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 Routix. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default {
  sendEmail,
  invoiceEmailTemplate,
  paymentConfirmationTemplate,
  referralBonusTemplate,
  subscriptionRenewalTemplate,
};

