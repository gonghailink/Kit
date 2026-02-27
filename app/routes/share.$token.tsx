import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import { createDb } from "~/lib/db.server";
import { shares, tabs, folders, bookmarks, users, workspaces as workspacesSchema, tagGroups as tagGroupsSchema, tags as tagsSchema, bookmarkTags as bookmarkTagsSchema } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag } from "~/lib/types";
import { useCallback } from "react";
import { buildFolderTree } from "~/lib/utils";
import type { ThemeWorkspace } from "~/lib/theme";
import { BookmarkView } from "~/components/layout/BookmarkView";


export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = (data as any)?.share?.name
    ? `${(data as any).share.name} · Kit`
    : "精選書籤 · Kit";

  return [
    { title },
    { name: "description", content: "分享的書籤收藏" },
  ];
};

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    throw new Response("找不到分享連結", { status: 404 });
  }

  const db = createDb(context.cloudflare.env);

  try {
    // 查詢分享資訊
    const share = await db
      .select()
      .from(shares)
      .where(eq(shares.share_token, token))
      .get();

    if (!share) {
      throw new Response("找不到分享連結", { status: 404 });
    }

    // 取得工作區主題設定
    const workspace = await db
      .select({
        theme_primary: workspacesSchema.theme_primary,
        theme_background: workspacesSchema.theme_background,
        theme_card: workspacesSchema.theme_card,
        theme_secondary: workspacesSchema.theme_secondary,
        theme_foreground: workspacesSchema.theme_foreground,
        theme_font: workspacesSchema.theme_font,
        theme_dark_primary: workspacesSchema.theme_dark_primary,
        theme_dark_background: workspacesSchema.theme_dark_background,
        theme_dark_card: workspacesSchema.theme_dark_card,
        theme_dark_secondary: workspacesSchema.theme_dark_secondary,
        theme_dark_foreground: workspacesSchema.theme_dark_foreground,
      })
      .from(workspacesSchema)
      .where(eq(workspacesSchema.id, share.workspace_id))
      .get();

    // 取得該工作區的所有 Tabs
    const allTabs = (await db
      .select()
      .from(tabs)
      .where(and(eq(tabs.user_id, share.user_id), eq(tabs.workspace_id, share.workspace_id)))
      .orderBy(asc(tabs.sort_order))
      .all()).map(t => ({ ...t, sort_order: t.sort_order ?? 0 }));

    // 取得所有資料夾
    const allFolders = (await db
      .select()
      .from(folders)
      .where(eq(folders.user_id, share.user_id))
      .orderBy(asc(folders.sort_order))
      .all()).map(f => ({ ...f, is_collapsed: !!f.is_collapsed, sort_order: f.sort_order ?? 0 }));

    // 取得所有書籤
    const allBookmarks = (await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.user_id, share.user_id))
      .orderBy(asc(bookmarks.sort_order))
      .all()).map(b => ({ ...b, sort_order: b.sort_order ?? 0 }));

    // 取得 tag 相關資料
    const allTagGroups = (await db
      .select()
      .from(tagGroupsSchema)
      .where(eq(tagGroupsSchema.user_id, share.user_id))
      .orderBy(asc(tagGroupsSchema.sort_order))
      .all()).map(tg => ({ ...tg, sort_order: tg.sort_order ?? 0 }));

    const allTags = (await db
      .select()
      .from(tagsSchema)
      .where(eq(tagsSchema.user_id, share.user_id))
      .orderBy(asc(tagsSchema.sort_order))
      .all()).map(t => ({ ...t, sort_order: t.sort_order ?? 0 }));

    const allBookmarkTags = await db
      .select()
      .from(bookmarkTagsSchema)
      .all();

    // 組裝結構（依據 tab.type 分支）
    const tabsData: TabData[] = (allTabs || []).map((tab) => {
      if (tab.type === "tags") {
        const tabBookmarks = (allBookmarks || []).filter(b => b.tab_id === tab.id);
        const tabTagGroups = (allTagGroups || []).filter(tg => tg.tab_id === tab.id);

        const bookmarksWithTags: BookmarkWithTags[] = tabBookmarks.map(b => ({
          ...b,
          tags: allBookmarkTags
            .filter(bt => bt.bookmark_id === b.id)
            .map(bt => allTags.find(t => t.id === bt.tag_id))
            .filter((t): t is Tag => !!t),
        }));

        const tagGroupsWithTags: TagGroupWithTags[] = tabTagGroups.map(tg => ({
          ...tg,
          filter_mode: tg.filter_mode as TagGroupWithTags["filter_mode"],
          tags: (allTags || []).filter(t => t.tag_group_id === tg.id),
        }));

        return {
          ...tab,
          bookmarks: bookmarksWithTags,
          tagGroups: tagGroupsWithTags,
        } as TabWithTags;
      } else {
        return {
          ...tab,
          folders: buildFolderTree(
            (allFolders || []).filter((f) => f.tab_id === tab.id),
            (allBookmarks || []).filter((b) =>
              (allFolders || []).some((f) => f.id === b.folder_id && f.tab_id === tab.id)
            )
          ),
        } as TabWithFolders;
      }
    });

    // 取得擁有者的 data_hash
    const ownerUser = await db
      .select({ data_hash: users.data_hash })
      .from(users)
      .where(eq(users.id, share.user_id))
      .get();

    return {
      tabs: tabsData,
      shareToken: token,
      share: {
        name: share.name,
        extra_btn_title: share.extra_btn_title,
        extra_btn_url: share.extra_btn_url,
      },
      workspace: workspace ?? null,
      dataHash: ownerUser?.data_hash ?? null,
    };
  } catch (error) {
    console.error("Share page error:", error);
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("載入分享內容失敗", { status: 500 });
  }
}

export async function clientLoader({ params, serverLoader }: ClientLoaderFunctionArgs) {
  const { getCacheKey, getCache, setCache, fetchDataHash } = await import("~/lib/cache.client");

  const shareToken = params.token;
  if (!shareToken) return serverLoader();

  const cacheKey = getCacheKey("share", { token: shareToken });
  const cached = getCache<any>(cacheKey);

  if (cached) {
    const serverHash = await fetchDataHash(shareToken);
    if (serverHash && serverHash === cached.hash) {
      return cached.data;
    }
  }

  const serverData = await serverLoader<typeof loader>();

  if (serverData.dataHash) {
    setCache(cacheKey, serverData.dataHash, serverData);
  }

  return serverData;
}
clientLoader.hydrate = true;

export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">載入中...</div>
    </div>
  );
}

export default function SharePage() {
  const { tabs: tabsData, share, workspace } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTabId = searchParams.get("tab");
  const activeTabId = (paramTabId && tabsData.find((t) => t.id === paramTabId))
    ? paramTabId
    : tabsData[0]?.id;
  const setActiveTabId = useCallback((tabId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabId);
      return next;
    }, { preventScrollReset: true });
  }, [setSearchParams]);

  return (
    <BookmarkView
      tabsData={tabsData as unknown as TabData[]}
      activeTabId={activeTabId}
      setActiveTabId={setActiveTabId}
      title={share.name ? `${share.name}` : "精選書籤"}
      extraBtn={share.extra_btn_title && share.extra_btn_url ? {
        title: share.extra_btn_title,
        url: share.extra_btn_url,
        isLink: true,
      } : undefined}
      workspace={workspace as ThemeWorkspace | undefined}
    />
  );
}
