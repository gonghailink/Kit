import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";
import { getFaviconUrl, isValidUrl } from "~/lib/utils";

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export async function action({ request, context }: ActionFunctionArgs) {
  const { user, headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        const folder_id = formData.get("folder_id") as string;
        const title = formData.get("title") as string;
        const url = formData.get("url") as string;
        const memo = formData.get("memo") as string | undefined;

        if (!folder_id) {
          return json<ActionData>({ error: "Folder ID 是必要的" }, { status: 400, headers });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "書籤標題不能為空" }, { status: 400, headers });
        }

        if (!url || url.trim() === "") {
          return json<ActionData>({ error: "URL 不能為空" }, { status: 400, headers });
        }

        const trimmedUrl = url.trim();

        // 驗證 URL 格式
        if (!isValidUrl(trimmedUrl)) {
          return json<ActionData>({ error: "URL 格式不正確" }, { status: 400, headers });
        }

        // 驗證 folder 是否屬於當前使用者
        const { data: folder } = await supabase
          .from("folders")
          .select("id")
          .eq("id", folder_id)
          .eq("user_id", user.id)
          .single();

        if (!folder) {
          return json<ActionData>({ error: "找不到該資料夾" }, { status: 404, headers });
        }

        // 取得當前最大的 sort_order
        const { data: existingBookmarks } = await supabase
          .from("bookmarks")
          .select("sort_order")
          .eq("folder_id", folder_id)
          .order("sort_order", { ascending: false })
          .limit(1);

        const newSortOrder = existingBookmarks && existingBookmarks.length > 0
          ? existingBookmarks[0].sort_order + 1000
          : 1000;

        // 自動取得 favicon
        const favicon_url = getFaviconUrl(trimmedUrl);

        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            folder_id,
            title: title.trim(),
            url: trimmedUrl,
            favicon_url,
            memo: memo ? memo.trim() : null,
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating bookmark:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ bookmark: data, success: true }, { headers });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;
        const url = formData.get("url") as string | undefined;
        const memo = formData.get("memo") as string | undefined;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400, headers });
        }

        const updates: any = {};

        if (title !== undefined) {
          if (title.trim() === "") {
            return json<ActionData>({ error: "書籤標題不能為空" }, { status: 400, headers });
          }
          updates.title = title.trim();
        }

        if (url !== undefined) {
          const trimmedUrl = url.trim();
          if (trimmedUrl === "") {
            return json<ActionData>({ error: "URL 不能為空" }, { status: 400, headers });
          }
          if (!isValidUrl(trimmedUrl)) {
            return json<ActionData>({ error: "URL 格式不正確" }, { status: 400, headers });
          }
          updates.url = trimmedUrl;
          updates.favicon_url = getFaviconUrl(trimmedUrl);
        }

        if (memo !== undefined) {
          updates.memo = memo.trim() || null;
        }

        if (Object.keys(updates).length === 0) {
          return json<ActionData>({ error: "沒有要更新的欄位" }, { status: 400, headers });
        }

        const { data, error } = await supabase
          .from("bookmarks")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating bookmark:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ bookmark: data, success: true }, { headers });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400, headers });
        }

        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting bookmark:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json<ActionData>({ success: true }, { headers });
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return json<ActionData>({ error: "缺少必要參數" }, { status: 400, headers });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return json<ActionData>({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400, headers });
        }

        // 批次更新
        for (let i = 0; i < ids.length; i++) {
          await supabase
            .from("bookmarks")
            .update({ sort_order: sortOrders[i] })
            .eq("id", ids[i])
            .eq("user_id", user.id);
        }

        return json<ActionData>({ success: true }, { headers });
      }

      case "move": {
        const id = formData.get("id") as string;
        const newFolderId = formData.get("newFolderId") as string;

        if (!id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400, headers });
        }

        if (!newFolderId) {
          return json<ActionData>({ error: "新資料夾 ID 是必要的" }, { status: 400, headers });
        }

        // 驗證書籤是否屬於當前使用者
        const { data: bookmark } = await supabase
          .from("bookmarks")
          .select("id, folder_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (!bookmark) {
          return json<ActionData>({ error: "找不到該書籤" }, { status: 404, headers });
        }

        // 驗證新資料夾是否屬於當前使用者
        const { data: newFolder } = await supabase
          .from("folders")
          .select("id")
          .eq("id", newFolderId)
          .eq("user_id", user.id)
          .single();

        if (!newFolder) {
          return json<ActionData>({ error: "找不到該資料夾" }, { status: 404, headers });
        }

        // 取得目標資料夾中最大的 sort_order
        const { data: maxSortOrderData } = await supabase
          .from("bookmarks")
          .select("sort_order")
          .eq("folder_id", newFolderId)
          .order("sort_order", { ascending: false })
          .limit(1)
          .single();

        const newSortOrder = maxSortOrderData ? maxSortOrderData.sort_order + 1 : 0;

        // 更新書籤的 folder_id 和 sort_order
        const { data, error } = await supabase
          .from("bookmarks")
          .update({
            folder_id: newFolderId,
            sort_order: newSortOrder,
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error moving bookmark:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ bookmark: data, success: true }, { headers });
      }

      default:
        return json<ActionData>({ error: "無效的操作" }, { status: 400, headers });
    }
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500, headers }
    );
  }
}
