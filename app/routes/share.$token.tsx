import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { TabWithFolders, FolderWithChildren } from "~/lib/types";
import { ChevronDown, ChevronRight, ExternalLink, Bookmark as BookmarkIcon, ArrowUp, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { buildFolderTree } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";


export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.share?.name
    ? `${data.share.name} 的精選書籤`
    : "精選書籤";

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

  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  try {
    // 查詢分享資訊
    const { data: share, error: shareError } = await supabase
      .from("shares")
      .select("*")
      .eq("share_token", token)
      .single();

    if (shareError || !share) {
      throw new Response("找不到分享連結", { status: 404 });
    }

    // 取得該使用者的所有 Tabs
    const { data: tabs, error: tabsError } = await supabase
      .from("tabs")
      .select("*")
      .eq("user_id", share.user_id)
      .order("sort_order", { ascending: true });

    if (tabsError) {
      throw new Response("載入書籤失敗", { status: 500 });
    }

    // 取得所有資料夾
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", share.user_id)
      .order("sort_order", { ascending: true });

    if (foldersError) {
      throw new Response("載入資料夾失敗", { status: 500 });
    }

    // 取得所有書籤
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", share.user_id)
      .order("sort_order", { ascending: true });

    if (bookmarksError) {
      throw new Response("載入書籤失敗", { status: 500 });
    }

    // 組織成樹狀結構
    const tabsWithFolders: TabWithFolders[] = (tabs || []).map((tab) => ({
      ...tab,
      folders: buildFolderTree(
        (folders || []).filter((f) => f.tab_id === tab.id),
        (bookmarks || []).filter((b) =>
          (folders || []).some((f) => f.id === b.folder_id && f.tab_id === tab.id)
        )
      ),
    }));

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

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function FolderCard({ folder }: { folder: FolderWithChildren }) {
  return (
    <div className="bg-card/85 rounded-xl p-6 shadow-sm">
      {/* 資料夾標題 */}
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {folder.title}
      </h2>

      {/* 書籤網格 */}
      {folder.bookmarks && folder.bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folder.bookmarks.map((bookmark) => (
            <a
              key={bookmark.id}
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all group"
            >
              <div className="flex items-start gap-3">
                {bookmark.favicon_url ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
                    <img
                      src={bookmark.favicon_url}
                      alt=""
                      className="w-5 h-5 flex-shrink-0 rounded-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                    {bookmark.title}
                  </h4>
                  {/* <p className="text-xs text-muted-foreground/80 truncate mt-1">
                    {getHostname(bookmark.url)}
                  </p> */}
                  {bookmark.memo && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {bookmark.memo}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-secondary/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            此資料夾尚無書籤
          </p>
        </div>
      )}

      {/* 子資料夾區域 */}
      {folder.children && folder.children.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <SubFolderTree folders={folder.children} />
        </div>
      )}
    </div>
  );
}

function SubFolderTree({ folders }: { folders: FolderWithChildren[] }) {
  return (
    <div className="space-y-4">
      {folders.map((folder) => (
        <CollapsibleSubFolder key={folder.id} folder={folder} />
      ))}
    </div>
  );
}

function CollapsibleSubFolder({ folder }: { folder: FolderWithChildren }) {
  const [isOpen, setIsOpen] = useState(!folder.is_collapsed);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-md font-medium text-muted-foreground mb-3 hover:text-primary transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {folder.title}
      </button>

      {isOpen && (
        <div className="ml-2">
          {folder.bookmarks && folder.bookmarks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {folder.bookmarks.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary/50 border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/70 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {bookmark.favicon_url ? (
                      <img
                        src={bookmark.favicon_url}
                        alt=""
                        className="w-5 h-5 flex-shrink-0 mt-0.5 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {bookmark.title}
                      </h4>
                      <p className="text-xs text-muted-foreground/80 truncate mt-1">
                        {getHostname(bookmark.url)}
                      </p>
                      {bookmark.memo && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {bookmark.memo}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {folder.children && folder.children.length > 0 && (
            <SubFolderTree folders={folder.children} />
          )}
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  const { tabs, share } = useLoaderData<typeof loader>();
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
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

  // 搜索过滤函数
  const filterFolder = (folder: FolderWithChildren, query: string): FolderWithChildren | null => {
    const lowerQuery = query.toLowerCase();

    // 过滤书签
    const filteredBookmarks = folder.bookmarks?.filter((bookmark) => {
      return (
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.url.toLowerCase().includes(lowerQuery) ||
        bookmark.memo?.toLowerCase().includes(lowerQuery)
      );
    });

    // 递归过滤子文件夹
    const filteredChildren = folder.children
      ?.map((child) => filterFolder(child, query))
      .filter((child): child is FolderWithChildren => child !== null);

    // 如果有匹配的书签或子文件夹，保留此文件夹
    if ((filteredBookmarks && filteredBookmarks.length > 0) || (filteredChildren && filteredChildren.length > 0)) {
      return {
        ...folder,
        bookmarks: filteredBookmarks || [],
        children: filteredChildren || [],
      };
    }

    return null;
  };

  // 应用搜索过滤
  const filteredTab = activeTab && searchQuery ? {
    ...activeTab,
    folders: activeTab.folders
      .map((folder) => filterFolder(folder, searchQuery))
      .filter((folder): folder is FolderWithChildren => folder !== null),
  } : activeTab;




  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/85 backdrop-blur-sm shadow-lg px-6 pr-0 md:pr-6 pt-4 pb-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-foreground/90">
              {share.name ? `${share.name} 的精選書籤` : "精選書籤"}
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {/* 搜尋功能 */}
            <div className="relative">
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
        {tabs.length > 0 && (
          <div className="">
            <div className="flex items-center gap-2 overflow-x-auto pr-4 md:pr-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    px-4 py-3 pr-0 md:pr-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
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
          </div>
        )}
      </div>

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
