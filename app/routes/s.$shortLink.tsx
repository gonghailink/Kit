import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { createDb } from "~/lib/db.server";
import { shares } from "~/drizzle/schema";
import { eq } from "drizzle-orm";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { shortLink } = params;

  if (!shortLink) {
    throw new Response("找不到短網址", { status: 404 });
  }

  const db = createDb(context.cloudflare.env);

  try {
    // 查詢短網址對應的分享資訊
    const share = await db
      .select({ share_token: shares.share_token })
      .from(shares)
      .where(eq(shares.short_link, shortLink))
      .get();

    if (!share) {
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
