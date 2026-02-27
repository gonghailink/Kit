import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import { createDb } from "~/lib/db.server";
import { tabs, folders, bookmarks, workspaces as workspacesSchema, tagGroups as tagGroupsSchema, tags as tagsSchema, bookmarkTags as bookmarkTagsSchema } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag } from "~/lib/types";
import { BookmarkSimple as BookmarkIcon, SignIn as LogIn } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { buildFolderTree } from "~/lib/utils";
import { generateThemeStyle } from "~/lib/theme";
import { getUser } from "~/lib/auth.server";
import { WorkspaceSwitcher } from "~/components/workspaces/WorkspaceSwitcher";
import { BookmarkView } from "~/components/layout/BookmarkView";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const title = "我的書籤 · Kit";

    return [
        { title },
        { name: "description", content: "我的書籤收藏" },
    ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
    const { user } = await getUser(request, context.cloudflare.env);

    if (!user) {
        return { user: null, tabs: [], workspaces: [], currentWorkspaceId: null, share: null, dataHash: null };
    }

    const db = createDb(context.cloudflare.env);
    const url = new URL(request.url);
    const workspaceParam = url.searchParams.get("workspace");

    try {
        // 取得該使用者的所有 Workspaces (按 sort_order 排序)
        const allWorkspaces = (await db
            .select()
            .from(workspacesSchema)
            .where(eq(workspacesSchema.user_id, user.id))
            .orderBy(asc(workspacesSchema.sort_order))
            .all()).map(w => ({ ...w, sort_order: w.sort_order ?? 0 }));

        // 確定當前的 workspace（從 URL 參數或使用第一個）
        const currentWorkspaceId = (workspaceParam && allWorkspaces.find(w => w.id === workspaceParam))
            ? workspaceParam
            : allWorkspaces[0]?.id;

        // 取得該使用者在當前 workspace 的 Tabs (按 sort_order 排序)
        const allTabs = currentWorkspaceId
            ? (await db
                .select()
                .from(tabs)
                .where(and(eq(tabs.user_id, user.id), eq(tabs.workspace_id, currentWorkspaceId)))
                .orderBy(asc(tabs.sort_order))
                .all()).map(t => ({ ...t, sort_order: t.sort_order ?? 0 }))
            : [];

        // 取得所有資料夾
        const allFolders = (await db
            .select()
            .from(folders)
            .where(eq(folders.user_id, user.id))
            .orderBy(asc(folders.sort_order))
            .all()).map(f => ({ ...f, is_collapsed: !!f.is_collapsed, sort_order: f.sort_order ?? 0 }));

        // 取得所有書籤
        const allBookmarks = (await db
            .select()
            .from(bookmarks)
            .where(eq(bookmarks.user_id, user.id))
            .orderBy(asc(bookmarks.sort_order))
            .all()).map(b => ({ ...b, sort_order: b.sort_order ?? 0 }));

        // 取得 tag 相關資料
        const allTagGroups = (await db
            .select()
            .from(tagGroupsSchema)
            .where(eq(tagGroupsSchema.user_id, user.id))
            .orderBy(asc(tagGroupsSchema.sort_order))
            .all()).map(tg => ({ ...tg, sort_order: tg.sort_order ?? 0 }));

        const allTags = (await db
            .select()
            .from(tagsSchema)
            .where(eq(tagsSchema.user_id, user.id))
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

        return {
            user,
            tabs: tabsData,
            workspaces: allWorkspaces,
            currentWorkspaceId: currentWorkspaceId || null,
            share: {
                name: "我的所有書籤",
                extra_btn_title: "進入管理後台",
                extra_btn_url: "/dashboard",
            },
            dataHash: user.data_hash,
        };
    } catch (error) {
        console.error("Me page error:", error);
        throw new Response("載入內容失敗", { status: 500 });
    }
}

export async function clientLoader({ request, serverLoader }: ClientLoaderFunctionArgs) {
    const { getCacheKey, getCache, setCache, fetchDataHash } = await import("~/lib/cache.client");

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspace") || "default";
    const cacheKey = getCacheKey("me", { workspace: workspaceId });

    const cached = getCache<any>(cacheKey);

    if (cached) {
        const serverHash = await fetchDataHash();
        if (serverHash && serverHash === cached.hash) {
            return cached.data;
        }
    }

    const serverData = await serverLoader<typeof loader>();

    if (serverData.dataHash && serverData.user) {
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

export default function MePage() {
    const data = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    if (!data.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <div className="text-center space-y-6 max-w-md w-full">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                        <BookmarkIcon className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            尚未登入
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            請先登入帳號以查看您的個人書籤收藏。
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold text-lg shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        <LogIn className="w-5 h-5" />
                        立即登入
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        還沒有帳號？ <Link to="/login" className="text-primary hover:underline font-medium">點此註冊</Link>
                    </p>
                </div>
            </div>
        );
    }

    const { tabs: tabsData, share, workspaces, currentWorkspaceId } = data;
    const currentWorkspace = workspaces.find((w: any) => w.id === currentWorkspaceId);
    const themeStyle = generateThemeStyle(currentWorkspace);
    const [activeTabId, setActiveTabId] = useState(tabsData[0]?.id);

    // 當 tabs 變化時，更新 activeTabId
    useEffect(() => {
        if (tabsData.length > 0 && !tabsData.find((t: any) => t.id === activeTabId)) {
            setActiveTabId(tabsData[0].id);
        }
    }, [tabsData, activeTabId]);

    return (
        <BookmarkView
            tabsData={tabsData}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            title={share?.name || "我的書籤"}
            extraBtn={share?.extra_btn_title && share?.extra_btn_url ? {
                title: share.extra_btn_title,
                url: share.extra_btn_url,
            } : undefined}
            workspaceSwitcher={
                workspaces.length > 0 ? (
                    <WorkspaceSwitcher
                        workspaces={workspaces}
                        currentWorkspaceId={currentWorkspaceId || ""}
                        onWorkspaceChange={(workspaceId) => {
                            setSearchParams({ workspace: workspaceId }, { preventScrollReset: true });
                        }}
                        allowEdit={false}
                    />
                ) : undefined
            }
            themeStyle={themeStyle}
        />
    );
}
