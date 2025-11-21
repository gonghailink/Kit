import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const { user, headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        const tab_id = formData.get("tab_id") as string;
        const parent_id = formData.get("parent_id") as string | null;
        const title = formData.get("title") as string;

        if (!tab_id) {
          return json({ error: "Tab ID 是必要的" }, { status: 400, headers });
        }

        if (!title || title.trim() === "") {
          return json({ error: "資料夾名稱不能為空" }, { status: 400, headers });
        }

        // 驗證 tab 是否屬於當前使用者
        const { data: tab } = await supabase
          .from("tabs")
          .select("id")
          .eq("id", tab_id)
          .eq("user_id", user.id)
          .single();

        if (!tab) {
          return json({ error: "找不到該 Tab" }, { status: 404, headers });
        }

        // 如果有 parent_id，驗證 parent folder 是否存在
        if (parent_id) {
          const { data: parentFolder } = await supabase
            .from("folders")
            .select("id")
            .eq("id", parent_id)
            .eq("user_id", user.id)
            .single();

          if (!parentFolder) {
            return json({ error: "找不到上層資料夾" }, { status: 404, headers });
          }
        }

        // 取得當前最大的 sort_order
        const { data: existingFolders } = await supabase
          .from("folders")
          .select("sort_order")
          .eq("tab_id", tab_id)
          .eq("parent_id", parent_id || null)
          .order("sort_order", { ascending: false })
          .limit(1);

        const newSortOrder = existingFolders && existingFolders.length > 0
          ? existingFolders[0].sort_order + 1000
          : 1000;

        const { data, error } = await supabase
          .from("folders")
          .insert({
            user_id: user.id,
            tab_id,
            parent_id: parent_id || null,
            title: title.trim(),
            is_collapsed: false,
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating folder:", error);
          return json({ error: error.message }, { status: 400, headers });
        }

        return json({ folder: data, success: true }, { headers });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;
        const is_collapsed = formData.get("is_collapsed") as string | undefined;

        if (!id) {
          return json({ error: "Folder ID 是必要的" }, { status: 400, headers });
        }

        const updates: any = {};
        if (title !== undefined) {
          if (title.trim() === "") {
            return json({ error: "資料夾名稱不能為空" }, { status: 400, headers });
          }
          updates.title = title.trim();
        }
        if (is_collapsed !== undefined) {
          updates.is_collapsed = is_collapsed === "true";
        }

        if (Object.keys(updates).length === 0) {
          return json({ error: "沒有要更新的欄位" }, { status: 400, headers });
        }

        const { data, error } = await supabase
          .from("folders")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating folder:", error);
          return json({ error: error.message }, { status: 400, headers });
        }

        return json({ folder: data, success: true }, { headers });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json({ error: "Folder ID 是必要的" }, { status: 400, headers });
        }

        // 刪除資料夾（會級聯刪除子資料夾和書籤）
        const { error } = await supabase
          .from("folders")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting folder:", error);
          return json({ error: error.message }, { status: 400, headers });
        }

        return json({ success: true }, { headers });
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return json({ error: "缺少必要參數" }, { status: 400, headers });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return json({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400, headers });
        }

        // 批次更新
        for (let i = 0; i < ids.length; i++) {
          await supabase
            .from("folders")
            .update({ sort_order: sortOrders[i] })
            .eq("id", ids[i])
            .eq("user_id", user.id);
        }

        return json({ success: true }, { headers });
      }

      default:
        return json({ error: "無效的操作" }, { status: 400, headers });
    }
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500, headers }
    );
  }
}
