-- Disable foreign key constraints temporarily
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
-- Step 1: Create workspaces table
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 2: Create default workspace for each existing user
INSERT INTO `workspaces` (`id`, `user_id`, `title`, `sort_order`, `created_at`)
SELECT
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))) as id,
    `id` as user_id,
    '我的工作區' as title,
    0 as sort_order,
    CURRENT_TIMESTAMP as created_at
FROM `users`;
--> statement-breakpoint
-- Step 3: Create new tabs table with workspace_id
CREATE TABLE `tabs_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Step 4: Copy data from old tabs to new tabs with workspace_id
INSERT INTO `tabs_new` (`id`, `user_id`, `workspace_id`, `title`, `sort_order`, `created_at`)
SELECT
    t.`id`,
    t.`user_id`,
    w.`id` as workspace_id,
    t.`title`,
    t.`sort_order`,
    t.`created_at`
FROM `tabs` t
LEFT JOIN `workspaces` w ON w.`user_id` = t.`user_id`;
--> statement-breakpoint
-- Step 5: Update folders to point to new tabs (maintain relationships)
-- Since folders have foreign key to tabs, we need to handle this carefully
-- Folders will automatically work because we're keeping the same tab IDs
--> statement-breakpoint
-- Step 6: Drop old tabs table
DROP TABLE `tabs`;
--> statement-breakpoint
-- Step 7: Rename new table to tabs
ALTER TABLE `tabs_new` RENAME TO `tabs`;
--> statement-breakpoint
-- Re-enable foreign key constraints
PRAGMA foreign_keys=ON;