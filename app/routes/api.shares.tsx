import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";
import type { Share } from "~/lib/types";

// GET: 取得當前使用者的分享連結
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user, headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  try {
    const { data, error } = await supabase
      .from("shares")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shares:", error);
      return json<ActionData>({ error: error.message }, { status: 400, headers });
    }

    return json({ shares: data }, { headers });
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500, headers }
    );
  }
}

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

// POST: 建立或刪除分享連結
export async function action({ request, context }: ActionFunctionArgs) {
  const { user, headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        // 檢查是否已經有分享連結
        const { data: existingShares } = await supabase
          .from("shares")
          .select("id")
          .eq("user_id", user.id);

        // 如果已有分享連結，返回錯誤
        if (existingShares && existingShares.length > 0) {
          return json<ActionData>({ error: "您已經建立過分享連結" }, { status: 400, headers });
        }

        // 生成唯一的分享 token
        const shareToken = crypto.randomUUID().replace(/-/g, "");

        // 建立分享連結
        const { data, error } = await supabase
          .from("shares")
          .insert({
            user_id: user.id,
            share_token: shareToken,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating share:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
        }

        return json({ share: data, success: true }, { headers });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Share ID 是必要的" }, { status: 400, headers });
        }

        const { error } = await supabase
          .from("shares")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting share:", error);
          return json<ActionData>({ error: error.message }, { status: 400, headers });
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
