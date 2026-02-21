-- Step 1: Backup bookmarks data
CREATE TABLE `bookmarks_backup` AS SELECT * FROM `bookmarks`;
--> statement-breakpoint
-- Step 2: Backup folders data
CREATE TABLE `folders_backup` AS SELECT * FROM `folders`;
--> statement-breakpoint
-- Step 3: Backup tabs data
CREATE TABLE `tabs_backup` AS SELECT * FROM `tabs`;
--> statement-breakpoint
-- Step 4: Drop bookmarks table (to remove foreign key constraint)
DROP TABLE `bookmarks`;
--> statement-breakpoint
-- Step 5: Drop folders table (to remove foreign key constraint)
DROP TABLE `folders`;
--> statement-breakpoint
-- Step 6: Drop tabs table
DROP TABLE `tabs`;
--> statement-breakpoint
-- Step 7: Create workspaces table
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 8: Create default workspace for each existing user
INSERT INTO `workspaces` (`id`, `user_id`, `title`, `sort_order`, `created_at`)
SELECT
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))) as id,
    `id` as user_id,
    '我的工作區' as title,
    0 as sort_order,
    CURRENT_TIMESTAMP as created_at
FROM `users`;
--> statement-breakpoint
-- Step 9: Create new tabs table with workspace_id
CREATE TABLE `tabs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 10: Restore tabs data with workspace_id
INSERT INTO `tabs` (`id`, `user_id`, `workspace_id`, `title`, `sort_order`, `created_at`)
SELECT
    t.`id`,
    t.`user_id`,
    w.`id` as workspace_id,
    t.`title`,
    COALESCE(t.`sort_order`, 0) as sort_order,
    t.`created_at`
FROM `tabs_backup` t
INNER JOIN `workspaces` w ON w.`user_id` = t.`user_id`;
--> statement-breakpoint
-- Step 11: Recreate folders table
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tab_id` text NOT NULL,
	`parent_id` text,
	`title` text NOT NULL,
	`is_collapsed` integer DEFAULT false,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 12: Restore folders data
INSERT INTO `folders` SELECT * FROM `folders_backup`;
--> statement-breakpoint
-- Step 13: Recreate bookmarks table
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`favicon_url` text,
	`memo` text,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 14: Restore bookmarks data
INSERT INTO `bookmarks` SELECT * FROM `bookmarks_backup`;
--> statement-breakpoint
-- Step 15: Clean up backup tables
DROP TABLE `tabs_backup`;
--> statement-breakpoint
DROP TABLE `folders_backup`;
--> statement-breakpoint
DROP TABLE `bookmarks_backup`;