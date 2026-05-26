import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { workspaces } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { bumpUserDataHash } from "~/lib/hash.server";

type ActionData =
  | { error: string; success?: never }
  | { success: true; error?: never };

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const TEXT_COLOR_VALUES = ["black", "white"] as const;
const BACKGROUND_TYPES = ["solid", "gradient", "image"] as const;
const HEX_THEME_FIELDS = [
  "theme_primary",
  "theme_background_color",
  "theme_background_gradient_from",
  "theme_background_gradient_to",
] as const;

function isValidBackgroundImageUrl(value: string): boolean {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function isTextColor(value: string): value is typeof TEXT_COLOR_VALUES[number] {
  return (TEXT_COLOR_VALUES as readonly string[]).includes(value);
}

function isBackgroundType(value: string): value is typeof BACKGROUND_TYPES[number] {
  return (BACKGROUND_TYPES as readonly string[]).includes(value);
}

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

    return { workspaces: userWorkspaces };
  } catch (error) {
    console.error("API Error:", error);
    return data(
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
          return data({ error: "工作區名稱不能為空" }, { status: 400 });
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

        await bumpUserDataHash(db, user.id);
        return { workspace: newWorkspace, success: true };
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;

        if (!id) {
          return data({ error: "工作區 ID 是必要的" }, { status: 400 });
        }

        if (!title || title.trim() === "") {
          return data({ error: "工作區名稱不能為空" }, { status: 400 });
        }

        // 主題欄位（空字串視為清除）
        const themeFields = [
          "theme_primary",
          "theme_font",
          "theme_text_color",
          "theme_background_type",
          "theme_background_color",
          "theme_background_gradient_from",
          "theme_background_gradient_to",
          "theme_background_image_url",
        ] as const;
        const themeUpdate: Record<string, string | null> = {};
        for (const field of themeFields) {
          const value = formData.get(field) as string | null;
          if (value !== null) {
            themeUpdate[field] = value === "" ? null : value;
          }
        }

        // 驗證 theme_font 值
        if (themeUpdate.theme_font && !["serif", "sans", "mono"].includes(themeUpdate.theme_font)) {
          return data({ error: "無效的字體設定" }, { status: 400 });
        }

        if (themeUpdate.theme_text_color && !isTextColor(themeUpdate.theme_text_color)) {
          return data({ error: "無效的文字色彩設定" }, { status: 400 });
        }

        if (themeUpdate.theme_background_type && !isBackgroundType(themeUpdate.theme_background_type)) {
          return data({ error: "無效的背景設定" }, { status: 400 });
        }

        for (const field of HEX_THEME_FIELDS) {
          const value = themeUpdate[field];
          if (value && !HEX_COLOR_RE.test(value)) {
            return data({ error: "無效的色碼設定" }, { status: 400 });
          }
        }

        if (
          themeUpdate.theme_background_image_url &&
          !isValidBackgroundImageUrl(themeUpdate.theme_background_image_url)
        ) {
          return data({ error: "背景圖片網址必須是 http(s) 或站內路徑" }, { status: 400 });
        }

        const updatedWorkspace = await db
          .update(workspaces)
          .set({ title: title.trim(), ...themeUpdate })
          .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
          .returning()
          .get();

        if (!updatedWorkspace) {
          return data({ error: "更新失敗" }, { status: 400 });
        }

        await bumpUserDataHash(db, user.id);
        return { workspace: updatedWorkspace, success: true };
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return data({ error: "工作區 ID 是必要的" }, { status: 400 });
        }

        // 刪除工作區（資料庫 CASCADE 會自動刪除關聯的 tabs、folders、bookmarks）
        await db
          .delete(workspaces)
          .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
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

        // 批次更新
        const statements = ids.map((id, index) =>
          db.update(workspaces)
            .set({ sort_order: sortOrders[index] })
            .where(and(eq(workspaces.id, id), eq(workspaces.user_id, user.id)))
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
