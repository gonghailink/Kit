CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`share_token` text NOT NULL,
	`name` text,
	`short_link` text,
	`extra_btn_title` text,
	`extra_btn_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_share_token_unique` ON `shares` (`share_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `shares_short_link_unique` ON `shares` (`short_link`);