PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`share_token` text NOT NULL,
	`name` text,
	`short_link` text,
	`extra_btn_title` text,
	`extra_btn_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Migrate existing shares to use the first workspace of each user
INSERT INTO `__new_shares`("id", "user_id", "workspace_id", "share_token", "name", "short_link", "extra_btn_title", "extra_btn_url", "created_at")
SELECT
  s."id",
  s."user_id",
  (SELECT w."id" FROM "workspaces" w WHERE w."user_id" = s."user_id" ORDER BY w."created_at" ASC LIMIT 1) as workspace_id,
  s."share_token",
  s."name",
  s."short_link",
  s."extra_btn_title",
  s."extra_btn_url",
  s."created_at"
FROM `shares` s
WHERE EXISTS (SELECT 1 FROM "workspaces" w WHERE w."user_id" = s."user_id");
--> statement-breakpoint
DROP TABLE `shares`;--> statement-breakpoint
ALTER TABLE `__new_shares` RENAME TO `shares`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `shares_share_token_unique` ON `shares` (`share_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `shares_short_link_unique` ON `shares` (`short_link`);