import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useState } from "react";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";
import { buildFolderTree } from "~/lib/utils";
import type { Tab, Folder, Bookmark, TabWithFolders, FolderWithChildren } from "~/lib/types";
import { Bookmark as BookmarkIcon, Plus, LogOut, Search } from "lucide-react";
import CreateTabDialog from "~/components/dialogs/CreateTabDialog";
import CreateFolderDialog from "~/components/dialogs/CreateFolderDialog";
import CreateBookmarkDialog from "~/components/dialogs/CreateBookmarkDialog";

// 安全解析 URL 的輔助函數
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url; // 如果 URL 無效，直接返回原始字串
  }
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user, headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);

  // 取得所有 Tabs (按 sort_order 排序)
  const { data: tabs, error: tabsError } = await supabase
    .from("tabs")
    .select("*")
    .order("sort_order");

  if (tabsError) {
    console.error("Error loading tabs:", tabsError);
    return json({ tabs: [], user }, { headers });
  }

  // 取得所有 Folders
  const { data: folders, error: foldersError } = await supabase
    .from("folders")
    .select("*")
    .order("sort_order");

  if (foldersError) {
    console.error("Error loading folders:", foldersError);
  }

  // 取得所有 Bookmarks
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("*")
    .order("sort_order");

  if (bookmarksError) {
    console.error("Error loading bookmarks:", bookmarksError);
  }

  // 組裝樹狀結構
  const tabsWithFolders: TabWithFolders[] = (tabs || []).map((tab: Tab) => ({
    ...tab,
    folders: buildFolderTree(
      (folders || []).filter((f: Folder) => f.tab_id === tab.id),
      (bookmarks || []).filter((b: Bookmark) =>
        (folders || []).some((f: Folder) => f.id === b.folder_id && f.tab_id === tab.id)
      )
    ),
  }));

  return json({ tabs: tabsWithFolders, user }, { headers });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { headers } = await requireAuth(request, context.cloudflare.env);
  const { supabase } = createSupabaseServerClient(request, context.cloudflare.env);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    await supabase.auth.signOut();
    return redirect("/login", { headers });
  }

  return json({ error: "無效的操作" }, { status: 400 });
}

export default function Dashboard() {
  const { tabs, user } = useLoaderData<typeof loader>();
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const logoutFetcher = useFetcher();

  // Dialog 狀態
  const [showCreateTabDialog, setShowCreateTabDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateBookmarkDialog, setShowCreateBookmarkDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookmarkIcon className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                書籤管理器
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative ml-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋書籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <Form method="post">
              <input type="hidden" name="intent" value="logout" />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </Form>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
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

          <button
            onClick={() => setShowCreateTabDialog(true)}
            className="px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {tabs.length === 0 ? (
          // 空狀態
          <div className="flex flex-col items-center justify-center h-full">
            <BookmarkIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              還沒有任何書籤
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              開始建立你的第一個 Tab 和資料夾吧！
            </p>
            <button
              onClick={() => setShowCreateTabDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              建立 Tab
            </button>
          </div>
        ) : activeTab ? (
          // 顯示資料夾和書籤
          <div className="max-w-7xl mx-auto">
            {activeTab.folders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  此 Tab 尚無資料夾
                </p>
                <button
                  onClick={() => setShowCreateFolderDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  建立資料夾
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {activeTab.folders.map((folder) => (
                  <div key={folder.id}>
                    {/* Folder Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {folder.title}
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedFolderId(folder.id);
                          setSelectedFolderName(folder.title);
                          setShowCreateBookmarkDialog(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bookmarks Grid */}
                    {folder.bookmarks && folder.bookmarks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {folder.bookmarks.map((bookmark) => (
                          <a
                            key={bookmark.id}
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-primary transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={bookmark.favicon_url || "/default-favicon.svg"}
                                alt=""
                                className="w-6 h-6 mt-1"
                                onError={(e) => {
                                  e.currentTarget.src = "/default-favicon.svg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary">
                                  {bookmark.title}
                                </h4>
                                {bookmark.memo && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {bookmark.memo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          此資料夾尚無書籤
                        </p>
                      </div>
                    )}

                    {/* Nested Folders */}
                    {folder.children && folder.children.length > 0 && (
                      <div className="mt-6 ml-6 space-y-6">
                        {folder.children.map((childFolder) => (
                          <div key={childFolder.id}>
                            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                              └─ {childFolder.title}
                            </h3>
                            {childFolder.bookmarks && childFolder.bookmarks.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {childFolder.bookmarks.map((bookmark) => (
                                  <a
                                    key={bookmark.id}
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-primary transition-all"
                                  >
                                    <div className="flex items-start gap-3">
                                      <img
                                        src={bookmark.favicon_url || "/default-favicon.svg"}
                                        alt=""
                                        className="w-6 h-6 mt-1"
                                        onError={(e) => {
                                          e.currentTarget.src = "/default-favicon.svg";
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary">
                                          {bookmark.title}
                                        </h4>
                                        {bookmark.memo && (
                                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                            {bookmark.memo}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                          {getHostname(bookmark.url)}
                                        </p>
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Dialogs */}
      <CreateTabDialog
        open={showCreateTabDialog}
        onOpenChange={setShowCreateTabDialog}
      />

      {activeTabId && (
        <CreateFolderDialog
          open={showCreateFolderDialog}
          onOpenChange={setShowCreateFolderDialog}
          tabId={activeTabId}
        />
      )}

      {selectedFolderId && (
        <CreateBookmarkDialog
          open={showCreateBookmarkDialog}
          onOpenChange={setShowCreateBookmarkDialog}
          folderId={selectedFolderId}
          folderName={selectedFolderName}
        />
      )}
    </div>
  );
}
