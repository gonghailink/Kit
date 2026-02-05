import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { folders, tabs } from "~/drizzle/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

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
        const parent_id = formData.get("parent_id") as string | null;
        const title = formData.get("title") as string;

        if (!tab_id) {
          return json<ActionData>({ error: "Tab ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "資料夾名稱不能為空" }, { status: 400 });
        }

        // 驗證 tab 是否屬於當前使用者
        const tab = await db
          .select({ id: tabs.id })
          .from(tabs)
          .where(and(eq(tabs.id, tab_id), eq(tabs.user_id, user.id)))
          .get();

        if (!tab) {
          return json<ActionData>({ error: "找不到該 Tab" }, { status: 404 });
        }

        // 如果有 parent_id，驗證 parent folder 是否存在
        if (parent_id) {
          const parentFolder = await db
            .select({ id: folders.id })
            .from(folders)
            .where(and(eq(folders.id, parent_id), eq(folders.user_id, user.id)))
            .get();

          if (!parentFolder) {
            return json<ActionData>({ error: "找不到上層資料夾" }, { status: 404 });
          }
        }

        // 取得當前最大的 sort_order
        // Note: Drizzle D1 doesn't handle NULL in equality well with standard operators sometimes, 
        // but eq(col, null) usually works or isNull(col). 
        // Logic: parent_id = parent_id OR (parent_id IS NULL AND row.parent_id IS NULL)
        // Here we handle parent_id explicitly.

        let query = db
          .select({ sort_order: folders.sort_order })
          .from(folders)
          .where(and(
            eq(folders.tab_id, tab_id),
            // Handle null parent_id
            parent_id ? eq(folders.parent_id, parent_id) : eq(folders.parent_id, null as any) // Type hack or construct query differently
          ));

        // Let's refine the query construction
        // Actually, create conditional where
        // const whereClause = and(eq(folders.tab_id, tab_id), parent_id ? eq(folders.parent_id, parent_id) : isNull(folders.parent_id));
        // But easier inline:

        const existingFolders = await db
          .select({ sort_order: folders.sort_order })
          .from(folders)
          .where(and(
            eq(folders.tab_id, tab_id),
            parent_id ? eq(folders.parent_id, parent_id) : eq(folders.parent_id, null as any) // Drizzle might need isNull or raw check?
            // Actually `eq(col, null)` in some drivers transforms to IS NULL. Let's hope sqlite driver does.
            // If not, we should import `isNull`.
          ))
          .orderBy(desc(folders.sort_order))
          .limit(1)
          .all();

        const newSortOrder = existingFolders && existingFolders.length > 0
          ? (existingFolders[0].sort_order || 0) + 1000
          : 1000;

        const newFolder = await db
          .insert(folders)
          .values({
            user_id: user.id,
            tab_id,
            parent_id: parent_id || null,
            title: title.trim(),
            is_collapsed: false,
            sort_order: newSortOrder,
          })
          .returning()
          .get();

        return json({ folder: newFolder, success: true });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;
        const is_collapsed = formData.get("is_collapsed") as string | undefined;

        if (!id) {
          return json<ActionData>({ error: "Folder ID 是必要的" }, { status: 400 });
        }

        const updates: any = {};
        if (title !== undefined) {
          if (title.trim() === "") {
            return json<ActionData>({ error: "資料夾名稱不能為空" }, { status: 400 });
          }
          updates.title = title.trim();
        }
        if (is_collapsed !== undefined) {
          updates.is_collapsed = is_collapsed === "true";
        }

        if (Object.keys(updates).length === 0) {
          return json<ActionData>({ error: "沒有要更新的欄位" }, { status: 400 });
        }

        const updatedFolder = await db
          .update(folders)
          .set(updates)
          .where(and(eq(folders.id, id), eq(folders.user_id, user.id)))
          .returning()
          .get();

        if (!updatedFolder) {
          return json<ActionData>({ error: "更新失敗" }, { status: 400 });
        }

        return json({ folder: updatedFolder, success: true });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Folder ID 是必要的" }, { status: 400 });
        }

        // 刪除資料夾（會級聯刪除子資料夾和書籤 - Database CASCADE should handle this if defined in schema?
        // In Supabase SQL Setup, `on delete cascade` was set.
        // In Drizzle Schema, I added `onDelete: "cascade"`.
        // So simple delete should work.

        await db
          .delete(folders)
          .where(and(eq(folders.id, id), eq(folders.user_id, user.id)))
          .run();

        return json<ActionData>({ success: true });
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return json<ActionData>({ error: "缺少必要參數" }, { status: 400 });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return json<ActionData>({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400 });
        }

        // 批次更新
        const statements = ids.map((id, index) =>
          db.update(folders)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(folders.id, id), eq(folders.user_id, user.id)))
        );

        await db.batch(statements as any);

        return json<ActionData>({ success: true });
      }

      default:
        return json<ActionData>({ error: "無效的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}
