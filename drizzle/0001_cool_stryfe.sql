CREATE TABLE `chatMessages` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditTransactions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus') NOT NULL,
	`description` varchar(255),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`imageUrl` varchar(512),
	`isPremium` boolean DEFAULT false,
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`style` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thumbnails` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`conversationId` varchar(64),
	`prompt` text NOT NULL,
	`imageUrl` varchar(512),
	`templateId` varchar(64),
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`creditsUsed` int DEFAULT 0,
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`style` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `thumbnails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;