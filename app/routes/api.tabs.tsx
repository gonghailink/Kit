import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tabs, workspaces } from "~/drizzle/schema";
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
        const title = formData.get("title") as string;
        const workspace_id = formData.get("workspace_id") as string;

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "Tab 名稱不能為空" }, { status: 400 });
        }

        if (!workspace_id) {
          return json<ActionData>({ error: "Workspace ID 是必要的" }, { status: 400 });
        }

        // 驗證 workspace 是否屬於當前使用者
        const workspace = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(and(eq(workspaces.id, workspace_id), eq(workspaces.user_id, user.id)))
          .get();

        if (!workspace) {
          return json<ActionData>({ error: "找不到該工作區" }, { status: 404 });
        }

        // 取得當前最大的 sort_order（只在該 workspace 內）
        const existingTabs = await db
          .select({ sort_order: tabs.sort_order })
          .from(tabs)
          .where(and(eq(tabs.user_id, user.id), eq(tabs.workspace_id, workspace_id)))
          .orderBy(desc(tabs.sort_order))
          .limit(1)
          .all();

        const newSortOrder = existingTabs && existingTabs.length > 0
          ? (existingTabs[0].sort_order || 0) + 1000
          : 1000;

        const type = (formData.get("type") as string) || "folders";
        if (type !== "folders" && type !== "tags") {
          return json<ActionData>({ error: "無效的 Tab 類型" }, { status: 400 });
        }

        const newTab = await db
          .insert(tabs)
          .values({
            user_id: user.id,
            workspace_id,
            title: title.trim(),
            type,
            sort_order: newSortOrder,
          })
          .returning()
          .get();

        await bumpUserDataHash(db, user.id);
        return json({ tab: newTab, success: true });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;

        if (!id) {
          return json<ActionData>({ error: "Tab ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "Tab 名稱不能為空" }, { status: 400 });
        }

        const updatedTab = await db
          .update(tabs)
          .set({ title: title.trim() })
          .where(and(eq(tabs.id, id), eq(tabs.user_id, user.id)))
          .returning()
          .get();

        if (!updatedTab) {
          return json<ActionData>({ error: "更新失敗" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return json({ tab: updatedTab, success: true });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "Tab ID 是必要的" }, { status: 400 });
        }

        await db
          .delete(tabs)
          .where(and(eq(tabs.id, id), eq(tabs.user_id, user.id)))
          .run();

        await bumpUserDataHash(db, user.id);
        return json<ActionData>({ success: true });
      }

      case "reorder": {
        const idsJson = formData.get("ids") as string;
        const sortOrdersJson = formData.get("sortOrders") as string;

        if (!idsJson || !sortOrdersJson) {
          return json<ActionData>({ error: "缺少必要參數" }, { status: 400 });
        }

        const ids = JSON.parse(idsJson) as string[];
        const sortOrders = JSON.parse(sortOrdersJson) as number[];

        if (ids.length !== sortOrders.length) {
          return json<ActionData>({ error: "IDs 和 sortOrders 長度不一致" }, { status: 400 });
        }

        // 批次更新
        const statements = ids.map((id, index) =>
          db.update(tabs)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(tabs.id, id), eq(tabs.user_id, user.id)))
        );

        await db.batch(statements as any);

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
