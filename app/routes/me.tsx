import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link, useSearchParams, type ClientLoaderFunctionArgs } from "@remix-run/react";
import { createDb } from "~/lib/db.server";
import { tabs, folders, bookmarks, workspaces as workspacesSchema, tagGroups as tagGroupsSchema, tags as tagsSchema, bookmarkTags as bookmarkTagsSchema } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, FolderWithChildren, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag } from "~/lib/types";
import { ArrowSquareOutIcon as ExternalLink, BookmarkSimpleIcon as BookmarkIcon, ArrowUp, SignIn as LogIn } from "@phosphor-icons/react";
import { useState, useMemo, useEffect, useRef } from "react";
import { buildFolderTree } from "~/lib/utils";
import { generateThemeStyle } from "~/lib/theme";
import { Input } from "~/components/ui/input";
import { FolderCard } from "~/components/page-ui/view/FolderCard";
import { ViewHeader } from "~/components/page-ui/view/ViewHeader";
import { getUser } from "~/lib/auth.server";
import { WorkspaceSwitcher } from "~/components/page-ui/dashboard/WorkspaceSwitcher";
import type { Workspace } from "~/components/page-ui/dashboard/WorkspaceSwitcher";
import { TagFilterBar } from "~/components/page-ui/shared/TagFilterBar";

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
        return json({ user: null, tabs: [], workspaces: [], currentWorkspaceId: null, share: null, dataHash: null });
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

        return json({
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
        });
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
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const activeTab = tabsData.find((t: any) => t.id === activeTabId);
    const [searchQuery, setSearchQuery] = useState("");

    // Tags 模式篩選
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

    // 當 tabs 變化時，更新 activeTabId
    useEffect(() => {
        if (tabsData.length > 0 && !tabsData.find((t: any) => t.id === activeTabId)) {
            setActiveTabId(tabsData[0].id);
        }
    }, [tabsData, activeTabId]);

    // 切換 tab 時清除篩選
    useEffect(() => {
        setSelectedTagIds(new Set());
        setSearchQuery("");
    }, [activeTabId]);

    const scrollToTop = () => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Folders 模式：搜尋過濾函數
    const filterFolder = (folder: FolderWithChildren, query: string): FolderWithChildren | null => {
        const lowerQuery = query.toLowerCase();

        const filteredBookmarks = folder.bookmarks?.filter((bookmark) => {
            return (
                bookmark.title.toLowerCase().includes(lowerQuery) ||
                bookmark.url.toLowerCase().includes(lowerQuery) ||
                bookmark.memo?.toLowerCase().includes(lowerQuery)
            );
        });

        const filteredChildren = folder.children
            ?.map((child) => filterFolder(child, query))
            .filter((child): child is FolderWithChildren => child !== null);

        if ((filteredBookmarks && filteredBookmarks.length > 0) || (filteredChildren && filteredChildren.length > 0)) {
            return {
                ...folder,
                bookmarks: filteredBookmarks || [],
                children: filteredChildren || [],
            };
        }

        return null;
    };

    // 判斷當前 tab 類型
    const isActiveTagsTab = activeTab && activeTab.type === "tags";
    const activeFoldersTab = activeTab && activeTab.type !== "tags" ? activeTab as unknown as TabWithFolders : null;
    const activeTagsTab = activeTab && activeTab.type === "tags" ? activeTab as unknown as TabWithTags : null;

    // Folders 模式：應用搜尋過濾
    const filteredFoldersTab = activeFoldersTab && searchQuery ? {
        ...activeFoldersTab,
        folders: activeFoldersTab.folders
            .map((folder: FolderWithChildren) => filterFolder(folder, searchQuery))
            .filter((folder: FolderWithChildren | null): folder is FolderWithChildren => folder !== null),
    } : activeFoldersTab;

    // Tags 模式：篩選書籤
    const filteredTagsBookmarks = useMemo(() => {
        if (!activeTagsTab) return [];
        let result = activeTagsTab.bookmarks;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter((b: BookmarkWithTags) =>
                b.title.toLowerCase().includes(lowerQuery) ||
                b.url.toLowerCase().includes(lowerQuery) ||
                b.memo?.toLowerCase().includes(lowerQuery)
            );
        }

        if (selectedTagIds.size > 0 && activeTagsTab.tagGroups) {
            // 按 tagGroup 分組已選取的 tagIds
            const groupSelections = activeTagsTab.tagGroups
                .map((group: TagGroupWithTags) => ({
                    filterMode: group.filter_mode,
                    tagIds: group.tags.map((t: Tag) => t.id).filter((id: string) => selectedTagIds.has(id)),
                }))
                .filter((g: { filterMode: string; tagIds: string[] }) => g.tagIds.length > 0);

            result = result.filter((b: BookmarkWithTags) => {
                const bookmarkTagIds = new Set(b.tags.map((t: Tag) => t.id));
                return groupSelections.every((group: { filterMode: string; tagIds: string[] }) => {
                    if (group.filterMode === "and") {
                        return group.tagIds.every((id: string) => bookmarkTagIds.has(id));
                    }
                    return group.tagIds.some((id: string) => bookmarkTagIds.has(id));
                });
            });
        }

        return result;
    }, [activeTagsTab, searchQuery, selectedTagIds]);

    const toggleTag = (tagId: string) => {
        const group = activeTagsTab?.tagGroups.find((g: TagGroupWithTags) =>
            g.tags.some((t: Tag) => t.id === tagId)
        );
        setSelectedTagIds((prev) => {
            const next = new Set(prev);
            if (next.has(tagId)) {
                next.delete(tagId);
            } else {
                // single 模式：先清除同 group 內的其他選取
                if (group?.filter_mode === "single") {
                    for (const t of group.tags) {
                        next.delete(t.id);
                    }
                }
                next.add(tagId);
            }
            return next;
        });
    };

    const clearGroupFilters = (tagGroup: TagGroupWithTags) => {
        setSelectedTagIds((prev) => {
            const next = new Set(prev);
            for (const tag of tagGroup.tags) {
                next.delete(tag.id);
            }
            return next;
        });
    };

    const hasGroupSelection = (tagGroup: TagGroupWithTags) => {
        return tagGroup.tags.some((tag) => selectedTagIds.has(tag.id));
    };

    // TagGroup id -> color 映射 & 排序索引
    const tagColorMap = useMemo(() => {
        if (!activeTagsTab) return {};
        const map: Record<string, string | null> = {};
        for (const tg of activeTagsTab.tagGroups) {
            map[tg.id] = tg.color;
        }
        return map;
    }, [activeTagsTab]);

    const tagGroupOrderMap = useMemo(() => {
        if (!activeTagsTab) return {};
        const map: Record<string, number> = {};
        activeTagsTab.tagGroups.forEach((tg, index) => {
            map[tg.id] = index;
        });
        return map;
    }, [activeTagsTab]);

    return (
        <div style={themeStyle} className="h-screen flex flex-col bg-transparent">
            <ViewHeader
                title={share?.name || "我的書籤"}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                extraBtn={share?.extra_btn_title && share?.extra_btn_url ? {
                    title: share.extra_btn_title,
                    url: share.extra_btn_url
                } : undefined}
                tabs={tabsData}
                activeTabId={activeTabId}
                setActiveTabId={setActiveTabId}
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
            />

            <div ref={scrollAreaRef} className="flex-1 relative min-h-0 overflow-auto">
                <div className="container mx-auto px-4 py-8 flex flex-col">
                    {/* Tags 模式 */}
                    {isActiveTagsTab && activeTagsTab ? (
                        <>
                            <TagFilterBar
                                tagGroups={activeTagsTab.tagGroups}
                                selectedTagIds={selectedTagIds}
                                onToggleTag={toggleTag}
                                onClearGroupFilters={clearGroupFilters}
                                onClearAllFilters={() => setSelectedTagIds(new Set())}
                                hasGroupSelection={hasGroupSelection}
                            />

                            {/* Bookmarks Grid */}
                            {filteredTagsBookmarks.length === 0 ? (
                                <div className="bg-card rounded-lg shadow-sm p-6">
                                    <div className="text-center py-12">
                                        <BookmarkIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">
                                            {searchQuery || selectedTagIds.size > 0
                                                ? "沒有符合條件的書籤"
                                                : "此 Tab 尚無書籤"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredTagsBookmarks.map((bookmark: BookmarkWithTags) => (
                                        <a
                                            key={bookmark.id}
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                {bookmark.favicon_url ? (
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
                                                        <img
                                                            src={bookmark.favicon_url}
                                                            alt=""
                                                            className="w-5 h-5 flex-shrink-0 rounded-sm"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                                        {bookmark.title}
                                                    </h4>
                                                    {bookmark.memo && (
                                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                            {bookmark.memo}
                                                        </p>
                                                    )}
                                                    {bookmark.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {[...bookmark.tags].sort((a, b) => (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999)).map((tag: Tag) => {
                                                                const color = tagColorMap[tag.tag_group_id] || null;
                                                                return (
                                                                    <span
                                                                        key={tag.id}
                                                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                                                        style={{
                                                                            backgroundColor: color ? `${color}20` : "hsl(var(--secondary))",
                                                                            color: color || "hsl(var(--foreground))",
                                                                        }}
                                                                    >
                                                                        {tag.title}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Folders 模式 */
                        <>
                            {!filteredFoldersTab || filteredFoldersTab.folders.length === 0 ? (
                                <div className="bg-card rounded-lg shadow-sm p-6">
                                    <div className="text-center py-12">
                                        <BookmarkIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">
                                            {searchQuery ? "找不到符合搜尋條件的書籤" : "這個 Tab 目前沒有任何書籤"}
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="mt-4 text-primary hover:underline"
                                            >
                                                清除搜尋
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {searchQuery && (
                                        <div className="mb-4 text-sm text-muted-foreground">
                                            搜尋結果：共找到 {filteredFoldersTab.folders.reduce((count: number, folder: FolderWithChildren) => {
                                                const countBookmarks = (f: FolderWithChildren): number => {
                                                    const bookmarkCount = f.bookmarks?.length || 0;
                                                    const childrenCount = f.children?.reduce((sum, child) => sum + countBookmarks(child), 0) || 0;
                                                    return bookmarkCount + childrenCount;
                                                };
                                                return count + countBookmarks(folder);
                                            }, 0)} 個書籤
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {filteredFoldersTab.folders.map((folder: FolderWithChildren) => (
                                            <FolderCard key={folder.id} folder={folder} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col items-center justify-center gap-4 mt-auto">
                        <p className="text-center mt-8 text-sm text-muted-foreground">
                            由{" "}
                            <Link to="/intro" className="text-primary hover:underline">
                                Kit (Bookmark Manager)
                            </Link>{" "}
                            提供
                        </p>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm opacity-50">
                            <img src="/favicon-white.svg" alt="Kit" className="h-full w-full object-contain p-[1px] rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-12 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
                    aria-label="返回頂部"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}

        </div>
    );
}
