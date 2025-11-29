import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { shortLink } = params;

  if (!shortLink) {
    throw new Response("找不到短網址", { status: 404 });
  }

  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  try {
    // 查詢短網址對應的分享資訊
    const { data: share, error } = await supabase
      .from("shares")
      .select("share_token")
      .eq("short_link", shortLink)
      .single();

    if (error || !share) {
      throw new Response("找不到此短網址", { status: 404 });
    }

    // 重新導向到原本的分享頁面
    return redirect(`/share/${share.share_token}`);
  } catch (error) {
    console.error("Short link redirect error:", error);
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("載入短網址失敗", { status: 500 });
  }
}
