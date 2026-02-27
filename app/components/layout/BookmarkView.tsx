import { Link } from "react-router";
import { BookmarkSimpleIcon as BookmarkIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { groupBookmarksByTagGroup } from "~/lib/utils";
import { FolderCard } from "~/components/folders/FolderCard";
import { ViewHeader } from "~/components/layout/ViewHeader";
import { BookmarkItem } from "~/components/bookmarks/BookmarkItem";
import { TagFilterBar } from "~/components/tags/TagFilterBar";
import type { TabWithFolders, FolderWithChildren, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag } from "~/lib/types";

interface BookmarkViewProps {
  tabsData: TabData[];
  activeTabId: string | undefined;
  setActiveTabId: (id: string) => void;
  title: string;
  extraBtn?: { title: string; url: string; isLink?: boolean };
  workspaceSwitcher?: React.ReactNode;
  themeStyle?: React.CSSProperties;
}

export function BookmarkView({
  tabsData,
  activeTabId,
  setActiveTabId,
  title,
  extraBtn,
  workspaceSwitcher,
  themeStyle,
}: BookmarkViewProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const activeTab = tabsData.find((t) => t.id === activeTabId);
  const [searchQuery, setSearchQuery] = useState("");

  // Tags 模式篩選
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  // 切換 tab 時清除篩選並重置滾動
  useEffect(() => {
    setSelectedTagIds(new Set());
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTabId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // 排除 group 模式的 TagGroup（不參與篩選計算）
    if (selectedTagIds.size > 0 && activeTagsTab.tagGroups) {
      const groupSelections = activeTagsTab.tagGroups
        .filter((group: TagGroupWithTags) => group.filter_mode !== "group")
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

  // 分組模式
  const groupTagGroup = useMemo(() => {
    if (!activeTagsTab) return null;
    return activeTagsTab.tagGroups.find(tg => tg.filter_mode === "group") || null;
  }, [activeTagsTab]);

  const groupTagIds = useMemo(() => {
    if (!groupTagGroup) return null;
    return new Set(groupTagGroup.tags.map(t => t.id));
  }, [groupTagGroup]);

  const groupedTagsBookmarks = useMemo(() => {
    if (!groupTagGroup) return null;
    return groupBookmarksByTagGroup(filteredTagsBookmarks, groupTagGroup);
  }, [groupTagGroup, filteredTagsBookmarks]);

  // 取得書籤的 display tags（排除 group 模式的 tags）
  const getDisplayTags = useCallback((bookmark: BookmarkWithTags) => {
    const sorted = [...bookmark.tags].sort((a, b) => {
      const groupDiff = (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999);
      if (groupDiff !== 0) return groupDiff;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    if (!groupTagIds) return sorted;
    return sorted.filter(t => !groupTagIds.has(t.id));
  }, [tagGroupOrderMap, groupTagIds]);

  return (
    <div style={themeStyle} className="min-h-screen flex flex-col bg-transparent">
      {/* Header */}
      <ViewHeader
        title={title}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraBtn={extraBtn}
        tabs={tabsData as unknown as TabData[]}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        workspaceSwitcher={workspaceSwitcher}
      />

      <main className="flex-1">
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
              ) : groupedTagsBookmarks ? (
                /* 分組顯示（參考資料夾模式） */
                <div className="space-y-6">
                  {groupedTagsBookmarks.map((group) => (
                    <div
                      key={group.tag?.id || "uncategorized"}
                      className="bg-card rounded-xl p-6 shadow-sm"
                    >
                      <h2
                        className="text-lg font-semibold mb-4"
                        style={{ color: group.color || undefined }}
                      >
                        {group.label}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.bookmarks.map((bookmark: BookmarkWithTags) => (
                          <BookmarkItem
                            key={bookmark.id}
                            bookmark={bookmark}
                            tags={getDisplayTags(bookmark)}
                            tagColorMap={tagColorMap}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 平面顯示 */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTagsBookmarks.map((bookmark: BookmarkWithTags) => (
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      tags={getDisplayTags(bookmark)}
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
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-12 right-6 p-4 bg-primary text-background rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="返回頂部"
        >
          <ArrowUpIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
