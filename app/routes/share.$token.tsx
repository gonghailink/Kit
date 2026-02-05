import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { createDb } from "~/lib/db.server";
import { shares, tabs, folders, bookmarks } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, FolderWithChildren } from "~/lib/types";
import { ChevronDown, ChevronRight, ExternalLink, Bookmark as BookmarkIcon, ArrowUp, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { buildFolderTree } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { FolderCard } from "~/components/page-ui/share-id/FolderCard";


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

    // 取得該使用者的所有 Tabs
    const allTabs = (await db
      .select()
      .from(tabs)
      .where(eq(tabs.user_id, share.user_id))
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

    // 組織成樹狀結構
    const tabsWithFolders: TabWithFolders[] = (allTabs || []).map((tab) => ({
      ...tab,
      folders: buildFolderTree(
        (allFolders || []).filter((f) => f.tab_id === tab.id),
        (allBookmarks || []).filter((b) =>
          (allFolders || []).some((f) => f.id === b.folder_id && f.tab_id === tab.id)
        )
      ),
    })) as any;

    return json({
      tabs: tabsWithFolders,
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
  const [activeTabId, setActiveTabId] = useState(tabsData[0]?.id);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const activeTab = tabsData.find((t) => t.id === activeTabId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 搜尋過濾函數
  const filterFolder = (folder: FolderWithChildren, query: string): FolderWithChildren | null => {
    const lowerQuery = query.toLowerCase();

    // 過濾書籤
    const filteredBookmarks = folder.bookmarks?.filter((bookmark) => {
      return (
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.url.toLowerCase().includes(lowerQuery) ||
        bookmark.memo?.toLowerCase().includes(lowerQuery)
      );
    });

    // 遞迴過濾子資料夾
    const filteredChildren = folder.children
      ?.map((child) => filterFolder(child, query))
      .filter((child): child is FolderWithChildren => child !== null);

    // 如果有匹配的書籤或子資料夾，保留此資料夾
    if ((filteredBookmarks && filteredBookmarks.length > 0) || (filteredChildren && filteredChildren.length > 0)) {
      return {
        ...folder,
        bookmarks: filteredBookmarks || [],
        children: filteredChildren || [],
      };
    }

    return null;
  };

  // 應用搜尋過濾
  const filteredTab = activeTab && searchQuery ? {
    ...activeTab,
    folders: activeTab.folders
      .map((folder) => filterFolder(folder, searchQuery))
      .filter((folder): folder is FolderWithChildren => folder !== null),
  } : activeTab;


  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Header */}
      <div className="z-10 bg-card/85 backdrop-blur-sm shadow-lg px-0 pt-4 pb-0 space-y-2">
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-foreground/90">
              {share.name ? `${share.name}` : "精選書籤"}
            </h1>
          </div>
          <div className="md:flex items-center gap-3">
            {/* 搜尋功能 */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="搜尋書籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 rounded-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {share.extra_btn_title && share.extra_btn_url && (
              <a
                href={share.extra_btn_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors font-medium text-sm flex items-center gap-2"
              >
                {share.extra_btn_title}
              </a>
            )}
          </div>
        </div>
        {/* Tabs Bar */}
        {tabsData.length > 0 && (
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 px-4">
              {tabsData.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                    ${activeTabId === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {tab.title}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      <ScrollArea className="flex-1 relative min-h-0">
        <div className="container mx-auto px-4 py-8">
          {/* Content */}
          {!filteredTab || filteredTab.folders.length === 0 ? (
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
                  搜尋結果：共找到 {filteredTab.folders.reduce((count, folder) => {
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
                {filteredTab.folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
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

      {/* Mobile Search Button */}
      <button
        onClick={() => setIsSearchSheetOpen(true)}
        className="md:hidden fixed bottom-32 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="搜尋書籤"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* Mobile Search Sheet */}
      <Sheet open={isSearchSheetOpen} onOpenChange={setIsSearchSheetOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>搜尋書籤</SheetTitle>
          </SheetHeader>
          <div className="mt-6 pb-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="輸入關鍵字搜尋..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    setIsSearchSheetOpen(false);
                  }
                }}
                className="pl-10 h-12 text-lg"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (searchQuery) {
                  setIsSearchSheetOpen(false);
                }
              }}
              disabled={!searchQuery}
              className="w-full h-12 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              搜尋
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
