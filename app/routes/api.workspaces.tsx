import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { workspaces, tabs } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

// GET - 獲取用戶的所有工作區
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  try {
    const userWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.user_id, user.id))
      .orderBy(workspaces.sort_order)
      .all();

    return json({ workspaces: userWorkspaces });
  } catch (error) {
    console.error("API Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}

// POST/PATCH/DELETE - 工作區的 CRUD 操作
export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "create": {
        const title = formData.get("title") as string;

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "工作區名稱不能為空" }, { status: 400 });
        }

        // 取得當前最大的 sort_order
        const existingWorkspaces = await db
          .select({ sort_order: workspaces.sort_order })
          .from(workspaces)
          .where(eq(workspaces.user_id, user.id))
          .orderBy(desc(workspaces.sort_order))
          .limit(1)
          .all();

        const newSortOrder = existingWorkspaces && existingWorkspaces.length > 0
          ? (existingWorkspaces[0].sort_order || 0) + 1000
          : 1000;

        const newWorkspace = await db
          .insert(workspaces)
          .values({
            user_id: user.id,
            title: title.trim(),
            sort_order: newSortOrder,
          })
          .returning()
          .get();

        return json({ workspace: newWorkspace, success: true });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;

        if (!id) {
          return json<ActionData>({ error: "工作區 ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return json<ActionData>({ error: "工作區名稱不能為空" }, { status: 400 });
        }

        const updatedWorkspace = await db
          .update(workspaces)
          .set({ title: title.trim() })
          .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
          .returning()
          .get();

        if (!updatedWorkspace) {
          return json<ActionData>({ error: "更新失敗" }, { status: 400 });
        }

        return json({ workspace: updatedWorkspace, success: true });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json<ActionData>({ error: "工作區 ID 是必要的" }, { status: 400 });
        }

        // 檢查這個工作區是否還有 tabs
        const workspaceTabs = await db
          .select({ id: tabs.id })
          .from(tabs)
          .where(eq(tabs.workspace_id, id))
          .limit(1)
          .all();

        if (workspaceTabs && workspaceTabs.length > 0) {
          return json<ActionData>(
            { error: "無法刪除含有分頁的工作區，請先刪除或移動所有分頁" },
            { status: 400 }
          );
        }

        // 刪除工作區
        await db
          .delete(workspaces)
          .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
          .run();

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
          db.update(workspaces)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
        );

        await db.batch(statements as any);

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
