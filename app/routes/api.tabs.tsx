import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";
import type { CreateTabInput } from "~/lib/types";

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
        const title = formData.get("title") as string;

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "Tab 名稱不能為空" }, { status: 400, headers });
        }

        // 取得當前最大的 sort_order
        const { data: existingTabs } = await supabase
          .from("tabs")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1);

        const newSortOrder = existingTabs && existingTabs.length > 0
          ? existingTabs[0].sort_order + 1000
          : 1000;

        const { data, error } = await supabase
          .from("tabs")
          .insert({
            user_id: user.id,
            title: title.trim(),
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating tab:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ tab: data, success: true }, { headers });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;

        if (!id) {
          return json<ActionData>({ error: "Tab ID 是必要的" }, { status: 400, headers });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "Tab 名稱不能為空" }, { status: 400, headers });
        }

        const { data, error } = await supabase
          .from("tabs")
          .update({ title: title.trim() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating tab:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ tab: data, success: true }, { headers });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Tab ID 是必要的" }, { status: 400, headers });
        }

        const { error } = await supabase
          .from("tabs")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting tab:", error);
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
        const updates = ids.map((id, index) => ({
          id,
          sort_order: sortOrders[index],
        }));

        for (const update of updates) {
          await supabase
            .from("tabs")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id)
            .eq("user_id", user.id);
        }

        return json<ActionData>({ success: true }, { headers });
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
