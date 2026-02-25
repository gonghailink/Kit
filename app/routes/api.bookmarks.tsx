import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { bookmarks, folders, tabs } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getFaviconUrl, isValidUrl } from "~/lib/utils";
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
        const folder_id = formData.get("folder_id") as string | null;
        const tab_id = formData.get("tab_id") as string | null;
        const title = formData.get("title") as string;
        const url = formData.get("url") as string;
        const memo = formData.get("memo") as string | undefined;

        if (!folder_id && !tab_id) {
          return json<ActionData>({ error: "必須指定 folder_id 或 tab_id" }, { status: 400 });
        }

        if (folder_id && tab_id) {
          return json<ActionData>({ error: "不能同時指定 folder_id 和 tab_id" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "書籤標題不能為空" }, { status: 400 });
        }

        if (!url || url.trim() === "") {
          return json<ActionData>({ error: "URL 不能為空" }, { status: 400 });
        }

        const trimmedUrl = url.trim();

        // 驗證 URL 格式
        if (!isValidUrl(trimmedUrl)) {
          return json<ActionData>({ error: "URL 格式不正確" }, { status: 400 });
        }

        // 自動取得 favicon
        const favicon_url = getFaviconUrl(trimmedUrl);

        if (folder_id) {
          // Folders 模式
          const folder = await db
            .select({ id: folders.id })
            .from(folders)
            .where(and(eq(folders.id, folder_id), eq(folders.user_id, user.id)))
            .get();

          if (!folder) {
            return json<ActionData>({ error: "找不到該資料夾" }, { status: 404 });
          }

          const existingBookmarks = await db
            .select({ sort_order: bookmarks.sort_order })
            .from(bookmarks)
            .where(eq(bookmarks.folder_id, folder_id))
            .orderBy(desc(bookmarks.sort_order))
            .limit(1)
            .all();

          const newSortOrder = existingBookmarks && existingBookmarks.length > 0
            ? (existingBookmarks[0].sort_order || 0) + 1000
            : 1000;

          const newBookmark = await db
            .insert(bookmarks)
            .values({
              user_id: user.id,
              folder_id,
              tab_id: null,
              title: title.trim(),
              url: trimmedUrl,
              favicon_url,
              memo: memo ? memo.trim() : null,
              sort_order: newSortOrder,
            })
            .returning()
            .get();

          await bumpUserDataHash(db, user.id);
          return json({ bookmark: newBookmark, success: true });
        } else {
          // Tags 模式
          const tab = await db
            .select({ id: tabs.id, type: tabs.type })
            .from(tabs)
            .where(and(eq(tabs.id, tab_id!), eq(tabs.user_id, user.id)))
            .get();

          if (!tab) {
            return json<ActionData>({ error: "找不到該 Tab" }, { status: 404 });
          }

          if (tab.type !== "tags") {
            return json<ActionData>({ error: "該 Tab 不是標籤模式" }, { status: 400 });
          }

          const existingBookmarks = await db
            .select({ sort_order: bookmarks.sort_order })
            .from(bookmarks)
            .where(eq(bookmarks.tab_id, tab_id!))
            .orderBy(desc(bookmarks.sort_order))
            .limit(1)
            .all();

          const newSortOrder = existingBookmarks && existingBookmarks.length > 0
            ? (existingBookmarks[0].sort_order || 0) + 1000
            : 1000;

          const newBookmark = await db
            .insert(bookmarks)
            .values({
              user_id: user.id,
              folder_id: null,
              tab_id: tab_id!,
              title: title.trim(),
              url: trimmedUrl,
              favicon_url,
              memo: memo ? memo.trim() : null,
              sort_order: newSortOrder,
            })
            .returning()
            .get();

          await bumpUserDataHash(db, user.id);
          return json({ bookmark: newBookmark, success: true });
        }
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;
        const url = formData.get("url") as string | undefined;
        const memo = formData.get("memo") as string | undefined;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400 });
        }

        const updates: any = {};

        if (title !== undefined) {
          if (title.trim() === "") {
            return json<ActionData>({ error: "書籤標題不能為空" }, { status: 400 });
          }
          updates.title = title.trim();
        }

        if (url !== undefined) {
          const trimmedUrl = url.trim();
          if (trimmedUrl === "") {
            return json<ActionData>({ error: "URL 不能為空" }, { status: 400 });
          }
          if (!isValidUrl(trimmedUrl)) {
            return json<ActionData>({ error: "URL 格式不正確" }, { status: 400 });
          }
          updates.url = trimmedUrl;
          updates.favicon_url = getFaviconUrl(trimmedUrl);
        }

        if (memo !== undefined) {
          updates.memo = memo.trim() || null;
        }

        if (Object.keys(updates).length === 0) {
          return json<ActionData>({ error: "沒有要更新的欄位" }, { status: 400 });
        }

        const updatedBookmark = await db
          .update(bookmarks)
          .set(updates)
          .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
          .returning()
          .get();

        if (!updatedBookmark) {
          return json<ActionData>({ error: "更新失敗或權限不足" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return json({ bookmark: updatedBookmark, success: true });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400 });
        }

        await db
          .delete(bookmarks)
          .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
          .run();

        await bumpUserDataHash(db, user.id);
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
          db.update(bookmarks)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
        );

        await db.batch(statements as any);

        await bumpUserDataHash(db, user.id);
        return json<ActionData>({ success: true });
      }

      case "move": {
        const id = formData.get("id") as string;
        const newFolderId = formData.get("newFolderId") as string;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400 });
        }

        if (!newFolderId) {
          return json<ActionData>({ error: "新資料夾 ID 是必要的" }, { status: 400 });
        }

        // 驗證書籤是否屬於當前使用者
        const bookmark = await db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
          .get();

        if (!bookmark) {
          return json<ActionData>({ error: "找不到該書籤" }, { status: 404 });
        }

        // 驗證新資料夾是否屬於當前使用者
        const newFolder = await db
          .select({ id: folders.id })
          .from(folders)
          .where(and(eq(folders.id, newFolderId), eq(folders.user_id, user.id)))
          .get();

        if (!newFolder) {
          return json<ActionData>({ error: "找不到該資料夾" }, { status: 404 });
        }

        // 取得目標資料夾中最大的 sort_order
        const maxSortOrderData = await db
          .select({ sort_order: bookmarks.sort_order })
          .from(bookmarks)
          .where(eq(bookmarks.folder_id, newFolderId))
          .orderBy(desc(bookmarks.sort_order))
          .limit(1)
          .get();

        const newSortOrder = maxSortOrderData ? (maxSortOrderData.sort_order || 0) + 1 : 0;

        // 更新書籤的 folder_id 和 sort_order
        const updatedBookmark = await db
          .update(bookmarks)
          .set({
            folder_id: newFolderId,
            sort_order: newSortOrder,
          })
          .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
          .returning()
          .get();

        if (!updatedBookmark) {
          return json<ActionData>({ error: "移動失敗" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return json({ bookmark: updatedBookmark, success: true });
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
