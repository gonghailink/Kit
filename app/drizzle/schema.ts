import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    password_hash: text("password_hash").notNull(),
    data_hash: text("data_hash").notNull().default("initial"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sort_order: real("sort_order").default(0),
    theme_primary: text("theme_primary"),
    theme_font: text("theme_font"),
    theme_text_color: text("theme_text_color"),
    theme_background_type: text("theme_background_type"),
    theme_background_color: text("theme_background_color"),
    theme_background_gradient_from: text("theme_background_gradient_from"),
    theme_background_gradient_to: text("theme_background_gradient_to"),
    theme_background_image_url: text("theme_background_image_url"),
    theme_background_image_overlay_color: text("theme_background_image_overlay_color"),
    theme_background_image_overlay_opacity: real("theme_background_image_overlay_opacity"),
    theme_background_image_blur: real("theme_background_image_blur"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tabs = sqliteTable("tabs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    workspace_id: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").notNull().default("folders"), // "folders" | "tags"
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const folders = sqliteTable("folders", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    tab_id: text("tab_id").notNull().references(() => tabs.id, { onDelete: "cascade" }),
    parent_id: text("parent_id").references((): any => folders.id, { onDelete: "cascade" }), // Self-reference need explicit type or lazy eval
    title: text("title").notNull(),
    is_collapsed: integer("is_collapsed", { mode: "boolean" }).default(false),
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const bookmarks = sqliteTable("bookmarks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    folder_id: text("folder_id").references(() => folders.id, { onDelete: "cascade" }), // nullable for tags mode
    tab_id: text("tab_id").references(() => tabs.id, { onDelete: "cascade" }), // for tags mode
    title: text("title").notNull(),
    url: text("url").notNull(),
    favicon_url: text("favicon_url"),
    memo: text("memo"),
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tagGroups = sqliteTable("tag_groups", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    tab_id: text("tab_id").notNull().references(() => tabs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    color: text("color"),
    filter_mode: text("filter_mode").notNull().default("or"), // "and" | "or" | "single" | "group"
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tags = sqliteTable("tags", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    tag_group_id: text("tag_group_id").notNull().references(() => tagGroups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const bookmarkTags = sqliteTable("bookmark_tags", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookmark_id: text("bookmark_id").notNull().references(() => bookmarks.id, { onDelete: "cascade" }),
    tag_id: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const shares = sqliteTable("shares", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    workspace_id: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    share_token: text("share_token").notNull().unique(),
    name: text("name"),
    short_link: text("short_link").unique(),
    extra_btn_title: text("extra_btn_title"),
    extra_btn_url: text("extra_btn_url"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
