import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { TabWithFolders, FolderWithChildren } from "~/lib/types";
import { ChevronDown, ChevronRight, ExternalLink, Bookmark as BookmarkIcon, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { buildFolderTree } from "~/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.share?.name
    ? `${data.share.name}的精選書籤`
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

function FolderTree({ folder }: { folder: FolderWithChildren }) {
  const [isOpen, setIsOpen] = useState(!folder.is_collapsed);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-lg font-semibold mb-3 hover:text-primary transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
        {folder.title}
      </button>

      {isOpen && (
        <div className="ml-6">
          {folder.bookmarks && folder.bookmarks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {folder.bookmarks.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-primary transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {bookmark.favicon_url ? (
                      <img
                        src={bookmark.favicon_url}
                        alt=""
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {bookmark.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {getHostname(bookmark.url)}
                      </p>
                      {bookmark.memo && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {bookmark.memo}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {folder.children && folder.children.length > 0 && (
            <div className="space-y-4">
              {folder.children.map((child) => (
                <FolderTree key={child.id} folder={child} />
              ))}
            </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-lg px-6 pt-4 pb-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/favicon.png" alt="logo" className="w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {share.name ? `${share.name}的精選書籤` : "精選書籤"}
            </h1>
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
        {/* Tabs Bar */}
        {tabs.length > 0 && (
          <div className="">
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                    ${activeTabId === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {!activeTab || activeTab.folders.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                這個 Tab 目前沒有任何書籤
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab.folders.map((folder) => (
                <FolderTree key={folder.id} folder={folder} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            由{" "}
            <Link to="/" className="text-primary hover:underline">
              Bookmarks Remix
            </Link>{" "}
            提供
          </p>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="返回頂部"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
