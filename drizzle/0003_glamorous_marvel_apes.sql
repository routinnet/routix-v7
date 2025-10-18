CREATE TABLE `generationHistory` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`referenceThumbnailId` varchar(64) NOT NULL,
	`userPrompt` text NOT NULL,
	`generatedImageUrl` varchar(512),
	`generatedPrompt` text,
	`model` varchar(50) DEFAULT 'dall-e-3',
	`creditsUsed` int NOT NULL,
	`status` enum('pending','generating','completed','failed') DEFAULT 'pending',
	`errorMessage` text,
	`qualityScore` decimal(3,2),
	`userRating` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `generationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referenceThumbnails` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` varchar(512) NOT NULL,
	`category` varchar(100) NOT NULL,
	`style` varchar(100),
	`viralScore` decimal(3,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `referenceThumbnails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thumbnailMetadata` (
	`id` varchar(64) NOT NULL,
	`referenceThumbnailId` varchar(64) NOT NULL,
	`subjectPosition` varchar(50),
	`textPosition` varchar(50),
	`textAlignment` varchar(50),
	`colorPalette` text,
	`lighting` varchar(100),
	`contrast` varchar(50),
	`mood` varchar(100),
	`emotionalExpression` varchar(100),
	`hasText` boolean DEFAULT false,
	`textStyle` varchar(100),
	`hasFace` boolean DEFAULT false,
	`faceExpression` varchar(100),
	`hasProduct` boolean DEFAULT false,
	`layerCount` int DEFAULT 1,
	`symmetry` varchar(50),
	`depthOfField` varchar(50),
	`extractedPrompt` text,
	`confidence` decimal(3,2) DEFAULT '0.95',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `thumbnailMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topicPreferences` (
	`id` varchar(64) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`bestMatchingReferenceThumbnailIds` text,
	`stylePreferences` text,
	`colorPreferences` text,
	`usageCount` int DEFAULT 0,
	`successRate` decimal(3,2) DEFAULT '0.5',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `topicPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `topicPreferences_topic_unique` UNIQUE(`topic`)
);
