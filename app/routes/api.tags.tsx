import { data, type ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tags, tagGroups } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
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
        const tag_group_id = formData.get("tag_group_id") as string;
        const title = formData.get("title") as string;

        if (!tag_group_id) {
          return data({ error: "TagGroup ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return data({ error: "標籤名稱不能為空" }, { status: 400 });
        }

        // 驗證 tag_group 是否屬於當前使用者
        const tagGroup = await db
          .select({ id: tagGroups.id })
          .from(tagGroups)
          .where(and(eq(tagGroups.id, tag_group_id), eq(tagGroups.user_id, user.id)))
          .get();

        if (!tagGroup) {
          return data({ error: "找不到該標籤群組" }, { status: 404 });
        }

        // 取得當前最大的 sort_order
        const existing = await db
          .select({ sort_order: tags.sort_order })
          .from(tags)
          .where(eq(tags.tag_group_id, tag_group_id))
          .orderBy(desc(tags.sort_order))
          .limit(1)
          .all();

        const newSortOrder = existing && existing.length > 0
          ? (existing[0].sort_order || 0) + 1000
          : 1000;

        const newTag = await db
          .insert(tags)
          .values({
            user_id: user.id,
            tag_group_id,
            title: title.trim(),
            sort_order: newSortOrder,
          })
          .returning()
          .get();

        await bumpUserDataHash(db, user.id);
        return { tag: newTag, success: true };
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string | undefined;

        if (!id) {
          return data({ error: "Tag ID 是必要的" }, { status: 400 });
        }

        const updates: any = {};
        if (title !== undefined) {
          if (title.trim() === "") {
            return data({ error: "標籤名稱不能為空" }, { status: 400 });
          }
          updates.title = title.trim();
        }

        if (Object.keys(updates).length === 0) {
          return data({ error: "沒有要更新的欄位" }, { status: 400 });
        }

        const updated = await db
          .update(tags)
          .set(updates)
          .where(and(eq(tags.id, id), eq(tags.user_id, user.id)))
          .returning()
          .get();

        if (!updated) {
          return data({ error: "更新失敗" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return { tag: updated, success: true };
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return data({ error: "Tag ID 是必要的" }, { status: 400 });
        }

        await db
          .delete(tags)
          .where(and(eq(tags.id, id), eq(tags.user_id, user.id)))
          .run();

        await bumpUserDataHash(db, user.id);
        return { success: true };
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return data({ error: "缺少必要參數" }, { status: 400 });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return data({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400 });
        }

        const statements = ids.map((id, index) =>
          db.update(tags)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(tags.id, id), eq(tags.user_id, user.id)))
        );

        await db.batch(statements as any);

        await bumpUserDataHash(db, user.id);
        return { success: true };
      }

      default:
        return data({ error: "無效的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return data(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}
