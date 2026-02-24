PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `tag_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tab_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tag_group_id` text NOT NULL,
	`title` text NOT NULL,
	`color` text,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`tag_group_id`) REFERENCES `tag_groups`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `__new_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`folder_id` text,
	`tab_id` text,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`favicon_url` text,
	`memo` text,
	`sort_order` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "user_id", "folder_id", "tab_id", "title", "url", "favicon_url", "memo", "sort_order", "created_at") SELECT "id", "user_id", "folder_id", NULL, "title", "url", "favicon_url", "memo", "sort_order", "created_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
CREATE TABLE `bookmark_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`bookmark_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
ALTER TABLE `tabs` ADD `type` text DEFAULT 'folders' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=ON;