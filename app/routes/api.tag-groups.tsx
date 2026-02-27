import { data, type ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tagGroups, tabs } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { bumpUserDataHash } from "~/lib/hash.server";

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        const tab_id = formData.get("tab_id") as string;
        const title = formData.get("title") as string;
        const color = formData.get("color") as string | null;
        const filter_mode = (formData.get("filter_mode") as string) || "or";

        if (!tab_id) {
          return data({ error: "Tab ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return data({ error: "標籤群組名稱不能為空" }, { status: 400 });
        }

        // 驗證 tab 是否屬於當前使用者且為 tags 模式
        const tab = await db
          .select({ id: tabs.id, type: tabs.type })
          .from(tabs)
          .where(and(eq(tabs.id, tab_id), eq(tabs.user_id, user.id)))
          .get();

        if (!tab) {
          return data({ error: "找不到該 Tab" }, { status: 404 });
        }

        if (tab.type !== "tags") {
          return data({ error: "該 Tab 不是標籤模式" }, { status: 400 });
        }

        // 取得當前最大的 sort_order
        const existing = await db
          .select({ sort_order: tagGroups.sort_order })
          .from(tagGroups)
          .where(eq(tagGroups.tab_id, tab_id))
          .orderBy(desc(tagGroups.sort_order))
          .limit(1)
          .all();

        const newSortOrder = existing && existing.length > 0
          ? (existing[0].sort_order || 0) + 1000
          : 1000;

        const validFilterMode = filter_mode === "and" ? "and" : filter_mode === "single" ? "single" : filter_mode === "group" ? "group" : "or";

        // 確保每個 tab 只有一個 group 模式的 TagGroup
        if (validFilterMode === "group") {
          await db
            .update(tagGroups)
            .set({ filter_mode: "or" })
            .where(and(
              eq(tagGroups.tab_id, tab_id),
              eq(tagGroups.user_id, user.id),
              eq(tagGroups.filter_mode, "group")
            ))
            .run();
        }

        const newTagGroup = await db
          .insert(tagGroups)
          .values({
            user_id: user.id,
            tab_id,
            title: title.trim(),
            color: color || null,
            filter_mode: validFilterMode,
            sort_order: newSortOrder,
          })
          .returning()
          .get();

        await bumpUserDataHash(db, user.id);
        return { tagGroup: newTagGroup, success: true };
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;
        const color = formData.get("color") as string | undefined;
        const filter_mode = formData.get("filter_mode") as string | undefined;

        if (!id) {
          return data({ error: "TagGroup ID 是必要的" }, { status: 400 });
        }

        const updates: any = {};
        if (title != null) {
          if (title.trim() === "") {
            return data({ error: "標籤群組名稱不能為空" }, { status: 400 });
          }
          updates.title = title.trim();
        }
        if (color !== undefined) {
          updates.color = color || null;
        }
        if (filter_mode !== undefined) {
          updates.filter_mode = filter_mode === "and" ? "and" : filter_mode === "single" ? "single" : filter_mode === "group" ? "group" : "or";
        }

        if (Object.keys(updates).length === 0) {
          return data({ error: "沒有要更新的欄位" }, { status: 400 });
        }

        // 確保每個 tab 只有一個 group 模式的 TagGroup
        if (updates.filter_mode === "group") {
          const existing = await db
            .select({ tab_id: tagGroups.tab_id })
            .from(tagGroups)
            .where(and(eq(tagGroups.id, id), eq(tagGroups.user_id, user.id)))
            .get();

          if (existing) {
            await db
              .update(tagGroups)
              .set({ filter_mode: "or" })
              .where(and(
                eq(tagGroups.tab_id, existing.tab_id),
                eq(tagGroups.user_id, user.id),
                eq(tagGroups.filter_mode, "group")
              ))
              .run();
          }
        }

        const updated = await db
          .update(tagGroups)
          .set(updates)
          .where(and(eq(tagGroups.id, id), eq(tagGroups.user_id, user.id)))
          .returning()
          .get();

        if (!updated) {
          return data({ error: "更新失敗" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return { tagGroup: updated, success: true };
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return data({ error: "TagGroup ID 是必要的" }, { status: 400 });
        }

        await db
          .delete(tagGroups)
          .where(and(eq(tagGroups.id, id), eq(tagGroups.user_id, user.id)))
          .run();

        await bumpUserDataHash(db, user.id);
        return { success: true };
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return data({ error: "缺少必要參數" }, { status: 400 });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return data({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400 });
        }

        const statements = ids.map((id, index) =>
          db.update(tagGroups)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(tagGroups.id, id), eq(tagGroups.user_id, user.id)))
        );

        await db.batch(statements as any);

        await bumpUserDataHash(db, user.id);
        return { success: true };
      }

      default:
        return data({ error: "無效的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return data(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}
