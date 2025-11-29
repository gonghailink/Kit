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

        // 取得顯示名稱
        const name = formData.get("name") as string | null;

        // 取得自訂短網址
        const shortLink = formData.get("short_link") as string | null;

        // 取得附加按鈕參數
        const extraBtnTitle = formData.get("extra_btn_title") as string | null;
        const extraBtnUrl = formData.get("extra_btn_url") as string | null;

        // 驗證短網址格式
        if (shortLink) {
          // 只允許英數字、底線和連字號
          const shortLinkRegex = /^[a-zA-Z0-9_-]+$/;
          if (!shortLinkRegex.test(shortLink)) {
            return json<ActionData>(
              { error: "短網址只能包含英數字、底線和連字號" },
              { status: 400, headers }
            );
          }

          // 檢查長度
          if (shortLink.length < 3 || shortLink.length > 50) {
            return json<ActionData>(
              { error: "短網址長度必須在 3-50 個字元之間" },
              { status: 400, headers }
            );
          }

          // 檢查短網址是否已被使用
          const { data: existingShortLink } = await supabase
            .from("shares")
            .select("id")
            .eq("short_link", shortLink)
            .single();

          if (existingShortLink) {
            return json<ActionData>(
              { error: "這個短網址已被使用，請換一個" },
              { status: 400, headers }
            );
          }
        }

        // 驗證附加按鈕（兩個都填或兩個都不填）
        if ((extraBtnTitle && !extraBtnUrl) || (!extraBtnTitle && extraBtnUrl)) {
          return json<ActionData>(
            { error: "附加按鈕的標題和網址必須同時填寫或同時留空" },
            { status: 400, headers }
          );
        }

        // 驗證附加按鈕 URL 格式
        if (extraBtnUrl) {
          try {
            new URL(extraBtnUrl);
          } catch {
            return json<ActionData>(
              { error: "附加按鈕的網址格式不正確" },
              { status: 400, headers }
            );
          }
        }

        // 生成唯一的分享 token
        const shareToken = crypto.randomUUID().replace(/-/g, "");

        // 建立分享連結
        const { data, error } = await supabase
          .from("shares")
          .insert({
            user_id: user.id,
            share_token: shareToken,
            name: name || null,
            short_link: shortLink || null,
            extra_btn_title: extraBtnTitle || null,
            extra_btn_url: extraBtnUrl || null,
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
