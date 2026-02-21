import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { shares } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

// GET: 取得當前工作區的分享連結
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id");

  if (!workspaceId) {
    return json({ error: "缺少 workspace_id 參數" }, { status: 400 });
  }

  try {
    const data = await db
      .select()
      .from(shares)
      .where(and(eq(shares.user_id, user.id), eq(shares.workspace_id, workspaceId)))
      .orderBy(desc(shares.created_at))
      .all();

    return json({ shares: data });
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}

// POST: 建立或刪除分享連結
export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        // 取得 workspace_id
        const workspaceId = formData.get("workspace_id") as string;

        if (!workspaceId) {
          return json<ActionData>({ error: "缺少 workspace_id 參數" }, { status: 400 });
        }

        // 檢查該 workspace 是否已經有分享連結
        const existingShares = await db
          .select({ id: shares.id })
          .from(shares)
          .where(and(eq(shares.user_id, user.id), eq(shares.workspace_id, workspaceId)))
          .all();

        // 如果已有分享連結，返回錯誤
        if (existingShares && existingShares.length > 0) {
          return json<ActionData>({ error: "此工作區已經建立過分享連結" }, { status: 400 });
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
              { status: 400 }
            );
          }

          // 檢查長度
          if (shortLink.length < 3 || shortLink.length > 50) {
            return json<ActionData>(
              { error: "短網址長度必須在 3-50 個字元之間" },
              { status: 400 }
            );
          }

          // 檢查短網址是否已被使用
          const existingShortLink = await db
            .select({ id: shares.id })
            .from(shares)
            .where(eq(shares.short_link, shortLink))
            .get();

          if (existingShortLink) {
            return json<ActionData>(
              { error: "這個短網址已被使用，請換一個" },
              { status: 400 }
            );
          }
        }

        // 驗證附加按鈕（兩個都填或兩個都不填）
        if ((extraBtnTitle && !extraBtnUrl) || (!extraBtnTitle && extraBtnUrl)) {
          return json<ActionData>(
            { error: "附加按鈕的標題和網址必須同時填寫或同時留空" },
            { status: 400 }
          );
        }

        // 驗證附加按鈕 URL 格式
        if (extraBtnUrl) {
          try {
            new URL(extraBtnUrl);
          } catch {
            return json<ActionData>(
              { error: "附加按鈕的網址格式不正確" },
              { status: 400 }
            );
          }
        }

        // 生成唯一的分享 token
        const shareToken = crypto.randomUUID().replace(/-/g, "");

        // 建立分享連結
        const newShare = await db
          .insert(shares)
          .values({
            user_id: user.id,
            workspace_id: workspaceId,
            share_token: shareToken,
            name: name || null,
            short_link: shortLink || null,
            extra_btn_title: extraBtnTitle || null,
            extra_btn_url: extraBtnUrl || null,
          })
          .returning()
          .get();

        return json({ share: newShare, success: true });
      }

      case "delete": {
        const id = formData.get("id") as string;
        const workspaceId = formData.get("workspace_id") as string;

        if (!id || !workspaceId) {
          return json<ActionData>({ error: "缺少必要參數" }, { status: 400 });
        }

        await db
          .delete(shares)
          .where(and(
            eq(shares.id, id),
            eq(shares.user_id, user.id),
            eq(shares.workspace_id, workspaceId)
          ))
          .run();

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
