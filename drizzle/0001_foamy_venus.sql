CREATE TABLE `accidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accidentType` enum('차량사고','보행자사고','주차장사고','단독사고') NOT NULL,
	`status` enum('접수','증거수집','파트너매칭','처리중','완료') NOT NULL DEFAULT '접수',
	`location` varchar(500),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`description` text,
	`injuryLevel` enum('없음','경상','중상','불명') DEFAULT '없음',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accidentId` int NOT NULL,
	`partnerId` int NOT NULL,
	`status` enum('요청','수락','거절','완료') NOT NULL DEFAULT '요청',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`completedAt` timestamp,
	`note` text,
	`fee` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`userId` int NOT NULL,
	`matchingId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('공업사','렉카','병원','변호사','손해사정사') NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` varchar(500) NOT NULL,
	`description` text,
	`rating` decimal(3,2) NOT NULL DEFAULT '0.00',
	`reviewCount` int NOT NULL DEFAULT 0,
	`totalCases` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','partner') NOT NULL DEFAULT 'user';