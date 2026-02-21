import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { createDb } from "~/lib/db.server";
import { shares, tabs, folders, bookmarks } from "~/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import type { TabWithFolders, FolderWithChildren } from "~/lib/types";
import { ChevronDown, ChevronRight, ExternalLink, Bookmark as BookmarkIcon, ArrowUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { buildFolderTree } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { FolderCard } from "~/components/page-ui/view/FolderCard";
import { ViewHeader } from "~/components/page-ui/view/ViewHeader";


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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeTab = tabsData.find((t) => t.id === activeTabId);
  const [searchQuery, setSearchQuery] = useState("");

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
      <ViewHeader
        title={share.name ? `${share.name}` : "精選書籤"}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraBtn={share.extra_btn_title && share.extra_btn_url ? {
          title: share.extra_btn_title,
          url: share.extra_btn_url,
          isLink: true
        } : undefined}
        tabs={tabsData}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
      />

      <ScrollArea ref={scrollAreaRef} className="flex-1 relative min-h-0">
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

    </div>
  );
}
