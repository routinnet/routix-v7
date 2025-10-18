# Routix Billing & Monetization Features Documentation

**Author:** Manus AI

**Date:** October 18, 2025

## 1. Introduction

This document outlines the new billing and monetization features implemented in Routix as part of Phase 2 development. These features aim to provide users with flexible subscription options, transparent credit management, and various ways to earn and spend credits within the chat-first interface.

## 2. Implemented Features

The following features have been integrated into the Routix platform:

### 2.1 Subscription Plans

Routix now offers various subscription plans to cater to different user needs. These plans provide recurring credits and access to premium features.

**Integration:**
- **UI Component:** `SubscriptionPlans.tsx`
- **Backend:** `payment.ts` router (`getSubscriptionPlans` procedure)
- **Database:** `plans` table in `drizzle/schema.ts`

Users can view available plans, their pricing, included credits, and features directly within the application. The UI allows users to select and potentially upgrade their subscription.

### 2.2 Payment Methods

Users can now manage their payment methods for purchasing credits or subscribing to plans.

**Integration:**
- **UI Component:** `PaymentMethod.tsx`
- **Backend:** `payment.ts` router (`updatePaymentMethod` procedure)

This component provides an interface for adding and managing credit card information, although the actual payment processing is handled by a third-party service (Stripe) for security.

### 2.3 Coupon Application

Users can apply coupon codes to receive discounts on purchases or subscriptions.

**Integration:**
- **UI Component:** `CouponApply.tsx`
- **Backend:** (Placeholder for future `applyCoupon` procedure in `payment.ts`)
- **Database:** `coupons` table in `drizzle/schema.ts`

The `CouponApply` component allows users to enter and validate coupon codes, with immediate feedback on their validity and applied discount.

### 2.4 Referral Sharing

Routix now includes a referral program, allowing users to share unique referral links and earn credits when new users sign up and make their first purchase.

**Integration:**
- **UI Component:** `ReferralShare.tsx`
- **Backend:** (Placeholder for future `generateReferralLink` and `trackReferral` procedures)
- **Database:** `referrals` table in `drizzle/schema.ts`

Users can easily copy their referral link or share it via email and WhatsApp, and track their total referrals and earned credits.

### 2.5 Billing History

Users can view a detailed history of their transactions, including credit purchases, subscription payments, and thumbnail generation usage.

**Integration:**
- **UI Component:** `BillingHistory.tsx`
- **Backend:** `payment.ts` router (`getBillingHistory` procedure)
- **Database:** `creditTransactions` table in `drizzle/schema.ts`

The billing history provides a transparent overview of all financial activities within their Routix account.

### 2.6 Invoice Generation and Tax Calculation

The system can now generate detailed invoices for purchases and subscriptions, and includes functionality for tax calculation.

**Integration:**
- **UI Component:** `InvoiceViewer.tsx`
- **Backend:** `invoiceGenerator.ts` (utility), `payment.ts` router (`calculateTax`, `generateInvoice` procedures)

Invoices can be viewed and downloaded by users. The tax calculation module provides a basic framework for applying sales tax, with future potential for location-based tax determination.

## 3. Technical Implementation Details

### 3.1 Database Schema Updates

The `drizzle/schema.ts` file has been updated to include new tables and fields:
- **`plans`**: Stores details about subscription plans (name, price, features, interval).
- **`subscriptions`**: Records user subscriptions to plans.
- **`coupons`**: Manages coupon codes and their properties.
- **`referrals`**: Stores referral codes and tracks referral relationships.
- **`creditTransactions`**: Detailed log of all credit-related transactions (purchase, usage, refund).
- **`users` table**: Added fields for trial usage and other billing-related information.

### 3.2 Backend tRPC Routers

The `server/payment.ts` router has been significantly expanded to handle all billing and monetization logic, including:
- `handleWebhook`: For processing Stripe webhook events.
- `getCreditPackages`: Retrieves available credit packages.
- `getSubscriptionPlans`: Fetches defined subscription plans.
- `createCheckoutSession`: Initiates a Stripe checkout session for credit purchases.
- `createSubscriptionCheckout`: Initiates a Stripe checkout session for subscriptions.
- `handlePaymentSuccess`: Processes successful payment events.
- `getBillingHistory`: Retrieves user's transaction history.
- `getSubscriptionStatus`: Provides current user subscription details.
- `cancelSubscription`: Handles subscription cancellation.
- `updatePaymentMethod`: Updates user's payment information.
- `getInvoices`: Fetches a list of user invoices.
- `downloadInvoice`: Provides a mechanism to download specific invoices.
- `calculateTax`: Calculates tax for a given amount and user.
- `generateInvoice`: Generates invoice data for a transaction.

### 3.3 Frontend UI Components

New React components have been developed in `client/src/components/` to provide a chat-first user experience for these features:
- `SubscriptionPlans.tsx`
- `PaymentMethod.tsx`
- `CouponApply.tsx`
- `ReferralShare.tsx`
- `BillingHistory.tsx`
- `InvoiceViewer.tsx`
- `TaxCalculator.tsx`

These components interact with the backend tRPC procedures to fetch and update billing-related data, ensuring a seamless user experience.

## 4. Usage Instructions

### 4.1 End-User Guide

1.  **Accessing Billing:** Navigate to the 'Settings' section from the main dashboard, then select the 'Billing' tab.
2.  **Viewing Plans:** On the 'Billing' page, you can see available credit packages and subscription plans under the respective tabs.
3.  **Making Purchases:** Select a credit package or subscription plan and follow the prompts to complete the purchase via Stripe.
4.  **Applying Coupons:** On the purchase/subscription page, look for the 'Apply Coupon' section to enter and apply your coupon code.
5.  **Referral Program:** Find your unique referral link in the 'Refer & Earn' section to share with friends and earn credits.
6.  **Transaction History:** View your past purchases, credit usage, and invoices under the 'History' tab.
7.  **Invoices:** Download PDF invoices for your records directly from the billing history.

### 4.2 Administrator Guide

1.  **Managing Plans/Coupons:** Subscription plans and coupon codes are currently defined statically in `server/payment.ts`. For dynamic management, a dedicated admin interface or database management tool would be required.
2.  **Stripe Integration:** Ensure Stripe API keys and webhook configurations are correctly set up in the environment variables.
3.  **Monitoring Transactions:** Credit transactions are logged in the `creditTransactions` table. Administrators can query this table for auditing and support purposes.
4.  **User Credits:** User credit balances are stored in the `users` table and updated via `updateUserCredits` function.

## 5. Future Enhancements

- Full Stripe integration for actual payment processing and subscription management.
- Dynamic management of subscription plans and coupon codes via an admin panel.
- Location-based tax calculation for invoices.
- Enhanced referral tracking and rewards system.
- Automated invoice PDF generation using a dedicated library.


