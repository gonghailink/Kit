ALTER TABLE `workspaces` ADD `theme_text_color` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `theme_background_type` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `theme_background_color` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `theme_background_gradient_from` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `theme_background_gradient_to` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `theme_background_image_url` text;--> statement-breakpoint
ALTER TABLE `workspaces` DROP COLUMN `theme_secondary`;--> statement-breakpoint
ALTER TABLE `workspaces` DROP COLUMN `theme_dark_primary`;--> statement-breakpoint
ALTER TABLE `workspaces` DROP COLUMN `theme_dark_secondary`;