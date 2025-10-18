CREATE TABLE `coupons` (
	`id` varchar(64) NOT NULL,
	`code` varchar(255) NOT NULL,
	`discountAmount` decimal(10,2),
	`discountPercent` decimal(5,2),
	`maxUses` int,
	`timesUsed` int DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`priceMonthly` decimal(10,2),
	`priceYearly` decimal(10,2),
	`creditsPerMonth` int,
	`maxThumbnails` int,
	`isPremium` boolean DEFAULT false,
	`stripeProductId` varchar(255),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` varchar(64) NOT NULL,
	`referrerId` varchar(64) NOT NULL,
	`referredId` varchar(64) NOT NULL,
	`bonusCreditsAwarded` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`planId` varchar(64) NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','canceled','past_due','unpaid') NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `creditTransactions` MODIFY COLUMN `type` enum('purchase','usage','refund','bonus','referral_bonus') NOT NULL;--> statement-breakpoint
ALTER TABLE `creditTransactions` ADD `stripeInvoiceId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `trialThumbnailsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);