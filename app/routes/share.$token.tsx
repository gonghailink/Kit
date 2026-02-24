import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { createDb } from "~/lib/db.server";
import { shares, tabs, folders, bookmarks, tagGroups as tagGroupsSchema, tags as tagsSchema, bookmarkTags as bookmarkTagsSchema } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, FolderWithChildren, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag } from "~/lib/types";
import { BookmarkSimple as BookmarkIcon, ArrowUp } from "@phosphor-icons/react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { buildFolderTree } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { FolderCard } from "~/components/page-ui/view/FolderCard";
import { ViewHeader } from "~/components/page-ui/view/ViewHeader";
import { BookmarkItem } from "~/components/page-ui/view/BookmarkItem";
import { TagFilterBar } from "~/components/page-ui/shared/TagFilterBar";


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

    return json({
      tabs: tabsData,
      shareToken: token,
      share: {
        name: share.name,
        extra_btn_title: share.extra_btn_title,
        extra_btn_url: share.extra_btn_url,
      }
    });
  } catch (error) {
    console.error("Share page error:", error);
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("載入分享內容失敗", { status: 500 });
  }
}

export default function SharePage() {
  const { tabs: tabsData, share } = useLoaderData<typeof loader>();
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeTab = tabsData.find((t) => t.id === activeTabId);
  const [searchQuery, setSearchQuery] = useState("");

  // Tags 模式篩選
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  // 切換 tab 時清除篩選
  useEffect(() => {
    setSelectedTagIds(new Set());
    setSearchQuery("");
  }, [activeTabId]);

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setShowScrollTop(target.scrollTop > 300);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
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

    // 搜尋篩選
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((b: BookmarkWithTags) =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.url.toLowerCase().includes(lowerQuery) ||
        b.memo?.toLowerCase().includes(lowerQuery)
      );
    }

    // Tag 篩選：各 group 內依 filter_mode (and/or/single)，group 之間為 AND
    if (selectedTagIds.size > 0 && activeTagsTab.tagGroups) {
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

  // TagGroup id -> color 映射 & 排序索引（用於書籤卡片上的 tag badge）
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
    <div className="h-screen flex flex-col bg-transparent">
      {/* Header */}
      <ViewHeader
        title={share.name ? `${share.name}` : "精選書籤"}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraBtn={share.extra_btn_title && share.extra_btn_url ? {
          title: share.extra_btn_title,
          url: share.extra_btn_url,
          isLink: true
        } : undefined}
        tabs={tabsData as unknown as TabData[]}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
      />

      <ScrollArea ref={scrollAreaRef} className="flex-1 relative min-h-0">
        <div className="container mx-auto px-4 py-8">
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
                <div className="bg-card/85 rounded-lg shadow-sm p-6">
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
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      tags={[...bookmark.tags].sort((a, b) => (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999))}
                      tagColorMap={tagColorMap}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Folders 模式 */
            <>
              {!filteredFoldersTab || filteredFoldersTab.folders.length === 0 ? (
                <div className="bg-card/85 rounded-lg shadow-sm p-6">
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
          <div className="flex flex-col items-center justify-center gap-4">
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
      </ScrollArea>

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
