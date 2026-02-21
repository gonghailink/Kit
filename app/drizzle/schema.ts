import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    password_hash: text("password_hash").notNull(),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tabs = sqliteTable("tabs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    workspace_id: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
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
    folder_id: text("folder_id").notNull().references(() => folders.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    favicon_url: text("favicon_url"),
    memo: text("memo"), // Added based on recent changes
    sort_order: real("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const shares = sqliteTable("shares", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    share_token: text("share_token").notNull().unique(),
    name: text("name"),
    short_link: text("short_link").unique(),
    extra_btn_title: text("extra_btn_title"),
    extra_btn_url: text("extra_btn_url"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
