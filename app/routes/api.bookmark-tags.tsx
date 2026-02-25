import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { bookmarkTags, bookmarks, tags } from "~/drizzle/schema";
import { eq, and } from "drizzle-orm";
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
      case "set": {
        const bookmark_id = formData.get("bookmark_id") as string;
        const tag_ids_json = formData.get("tag_ids") as string;

        if (!bookmark_id) {
          return json<ActionData>({ error: "Bookmark ID 是必要的" }, { status: 400 });
        }

        // 驗證書籤屬於當前使用者
        const bookmark = await db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(eq(bookmarks.id, bookmark_id), eq(bookmarks.user_id, user.id)))
          .get();

        if (!bookmark) {
          return json<ActionData>({ error: "找不到該書籤" }, { status: 404 });
        }

        const tagIds: string[] = tag_ids_json ? JSON.parse(tag_ids_json) : [];

        // 刪除所有現有的 bookmark_tags
        await db
          .delete(bookmarkTags)
          .where(eq(bookmarkTags.bookmark_id, bookmark_id))
          .run();

        // 插入新的 bookmark_tags
        if (tagIds.length > 0) {
          // 驗證所有 tag 都屬於當前使用者
          const validTags = await db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.user_id, user.id))
            .all();

          const validTagIds = new Set(validTags.map(t => t.id));
          const filteredTagIds = tagIds.filter(id => validTagIds.has(id));

          if (filteredTagIds.length > 0) {
            const insertValues = filteredTagIds.map(tag_id => ({
              bookmark_id,
              tag_id,
            }));

            for (const value of insertValues) {
              await db.insert(bookmarkTags).values(value).run();
            }
          }
        }

        await bumpUserDataHash(db, user.id);
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
