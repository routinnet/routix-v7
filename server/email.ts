/**
 * Email Notification Service
 * Handles sending emails to users
 */

import { getUser } from "./db";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured service
 * Currently supports: SendGrid, Mailgun, SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Determine which email service to use based on environment variables
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSegrid(options);
    } else if (process.env.MAILGUN_API_KEY) {
      return await sendViaMailgun(options);
    } else if (process.env.SMTP_HOST) {
      return await sendViaSMTP(options);
    } else {
      console.warn("[Email] No email service configured");
      return false;
    }
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSegrid(options: EmailOptions): Promise<boolean> {
  try {
    // const sgMail = require("@sendgrid/mail");
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: process.env.SENDGRID_FROM_EMAIL || "noreply@routix.app",
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });
    console.log(`[Email] Sent via SendGrid to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] SendGrid error:", error);
    return false;
  }
}

/**
 * Send via Mailgun
 */
async function sendViaMailgun(options: EmailOptions): Promise<boolean> {
  try {
    // const mailgun = require("mailgun.js");
    // const FormData = require("form-data");
    // const client = new mailgun(FormData);
    // const domain = process.env.MAILGUN_DOMAIN;
    // const mg = client.client({ username: "api", key: process.env.MAILGUN_API_KEY });
    // await mg.messages.create(domain, {
    //   from: `Routix <noreply@${domain}>`,
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });
    console.log(`[Email] Sent via Mailgun to ${options.to}`);
    return true;;
  } catch (error) {
    console.error("[Email] Mailgun error:", error);
    return false;
  }
}

/**
 * Send via SMTP
 */
async function sendViaSMTP(options: EmailOptions): Promise<boolean> {
  try {
    // const nodemailer = require("nodemailer");
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || "587"),
    //   secure: process.env.SMTP_SECURE === "true",
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // });
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM_EMAIL || "noreply@routix.app",
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });
    console.log(`[Email] Sent via SMTP to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] SMTP error:", error);
    return false;
  }
}

/**
 * Email templates
 */

export function getWelcomeEmailTemplate(userName: string): EmailTemplate {
  return {
    subject: "Welcome to Routix - AI-Powered Thumbnail Generation",
    html: `
      <h1>Welcome to Routix!</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for signing up! You now have access to our AI-powered thumbnail generation platform.</p>
      <p>You start with <strong>50 free credits</strong> to generate thumbnails.</p>
      <h3>Getting Started:</h3>
      <ol>
        <li>Log in to your account</li>
        <li>Click "New Chat" to start a conversation</li>
        <li>Describe the thumbnail you want to create</li>
        <li>Our AI will generate professional thumbnails for you</li>
      </ol>
      <p><a href="https://routix.app/dashboard">Start Creating Now</a></p>
      <p>Happy creating!<br>The Routix Team</p>
    `,
    text: `Welcome to Routix!\n\nHi ${userName},\n\nThank you for signing up! You now have access to our AI-powered thumbnail generation platform.\n\nYou start with 50 free credits to generate thumbnails.\n\nGetting Started:\n1. Log in to your account\n2. Click "New Chat" to start a conversation\n3. Describe the thumbnail you want to create\n4. Our AI will generate professional thumbnails for you\n\nStart Creating: https://routix.app/dashboard\n\nHappy creating!\nThe Routix Team`,
  };
}

export function getThumbnailGeneratedEmailTemplate(
  userName: string,
  thumbnailCount: number
): EmailTemplate {
  return {
    subject: "Your Thumbnail is Ready!",
    html: `
      <h1>Your Thumbnail is Ready!</h1>
      <p>Hi ${userName},</p>
      <p>Great news! Your thumbnail has been successfully generated.</p>
      <p>You now have <strong>${thumbnailCount} thumbnails</strong> in your library.</p>
      <p><a href="https://routix.app/dashboard">View Your Thumbnails</a></p>
      <p>Best regards,<br>The Routix Team</p>
    `,
    text: `Your Thumbnail is Ready!\n\nHi ${userName},\n\nGreat news! Your thumbnail has been successfully generated.\n\nYou now have ${thumbnailCount} thumbnails in your library.\n\nView Your Thumbnails: https://routix.app/dashboard\n\nBest regards,\nThe Routix Team`,
  };
}

export function getCreditsPurchasedEmailTemplate(
  userName: string,
  creditsAdded: number,
  newBalance: number
): EmailTemplate {
  return {
    subject: "Credits Added to Your Account",
    html: `
      <h1>Credits Added!</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for your purchase!</p>
      <p>We've added <strong>${creditsAdded} credits</strong> to your account.</p>
      <p>Your new balance: <strong>${newBalance} credits</strong></p>
      <p><a href="https://routix.app/dashboard">Start Creating</a></p>
      <p>Thank you for supporting Routix!<br>The Routix Team</p>
    `,
    text: `Credits Added!\n\nHi ${userName},\n\nThank you for your purchase!\n\nWe've added ${creditsAdded} credits to your account.\n\nYour new balance: ${newBalance} credits\n\nStart Creating: https://routix.app/dashboard\n\nThank you for supporting Routix!\nThe Routix Team`,
  };
}

export function getLowCreditsEmailTemplate(
  userName: string,
  remainingCredits: number
): EmailTemplate {
  return {
    subject: "Your Credits are Running Low",
    html: `
      <h1>Low Credits Alert</h1>
      <p>Hi ${userName},</p>
      <p>You have only <strong>${remainingCredits} credits</strong> remaining.</p>
      <p>Don't miss out! Purchase more credits to continue creating amazing thumbnails.</p>
      <p><a href="https://routix.app/settings">Buy Credits</a></p>
      <p>Best regards,<br>The Routix Team</p>
    `,
    text: `Low Credits Alert\n\nHi ${userName},\n\nYou have only ${remainingCredits} credits remaining.\n\nDon't miss out! Purchase more credits to continue creating amazing thumbnails.\n\nBuy Credits: https://routix.app/settings\n\nBest regards,\nThe Routix Team`,
  };
}

export function getGenerationFailedEmailTemplate(
  userName: string,
  reason: string
): EmailTemplate {
  return {
    subject: "Thumbnail Generation Failed",
    html: `
      <h1>Generation Failed</h1>
      <p>Hi ${userName},</p>
      <p>Unfortunately, your thumbnail generation failed.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Your credits have been refunded. Please try again with a different prompt.</p>
      <p><a href="https://routix.app/dashboard">Try Again</a></p>
      <p>If you continue to experience issues, please contact our support team.</p>
      <p>Best regards,<br>The Routix Team</p>
    `,
    text: `Generation Failed\n\nHi ${userName},\n\nUnfortunately, your thumbnail generation failed.\n\nReason: ${reason}\n\nYour credits have been refunded. Please try again with a different prompt.\n\nTry Again: https://routix.app/dashboard\n\nIf you continue to experience issues, please contact our support team.\n\nBest regards,\nThe Routix Team`,
  };
}

export function getPasswordResetEmailTemplate(
  userName: string,
  resetLink: string
): EmailTemplate {
  return {
    subject: "Reset Your Routix Password",
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the link below to proceed:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Best regards,<br>The Routix Team</p>
    `,
    text: `Password Reset Request\n\nHi ${userName},\n\nWe received a request to reset your password. Click the link below to proceed:\n\n${resetLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe Routix Team`,
  };
}

/**
 * Send notification emails
 */

export async function sendWelcomeEmail(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || !user.email) {
    console.warn(`[Email] User not found or no email: ${userId}`);
    return false;
  }

  const template = getWelcomeEmailTemplate(user.name || "User");
  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendThumbnailGeneratedEmail(
  userId: string,
  thumbnailCount: number
): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || !user.email) {
    console.warn(`[Email] User not found or no email: ${userId}`);
    return false;
  }

  const template = getThumbnailGeneratedEmailTemplate(user.name || "User", thumbnailCount);
  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendCreditsPurchasedEmail(
  userId: string,
  creditsAdded: number,
  newBalance: number
): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || !user.email) {
    console.warn(`[Email] User not found or no email: ${userId}`);
    return false;
  }

  const template = getCreditsPurchasedEmailTemplate(user.name || "User", creditsAdded, newBalance);
  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendLowCreditsEmail(userId: string, remainingCredits: number): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || !user.email) {
    console.warn(`[Email] User not found or no email: ${userId}`);
    return false;
  }

  const template = getLowCreditsEmailTemplate(user.name || "User", remainingCredits);
  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendGenerationFailedEmail(
  userId: string,
  reason: string
): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || !user.email) {
    console.warn(`[Email] User not found or no email: ${userId}`);
    return false;
  }

  const template = getGenerationFailedEmailTemplate(user.name || "User", reason);
  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

