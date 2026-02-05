import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher, Form, useSearchParams } from "@remix-run/react";
import { useState, useMemo, useEffect } from "react";
import { requireAuth, logout } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tabs as tabsSchema, folders as foldersSchema, bookmarks as bookmarksSchema } from "~/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { buildFolderTree } from "~/lib/utils";
import type { Tab, Folder, Bookmark, TabWithFolders, FolderWithChildren } from "~/lib/types";
import { Bookmark as BookmarkIcon, Plus, LogOut, MoreVertical, Edit, Trash2, GripVertical, Share2, FolderOpen, ChevronDown, UserIcon, FolderPlusIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CreateTabDialog from "~/components/dialogs/CreateTabDialog";
import CreateFolderDialog from "~/components/dialogs/CreateFolderDialog";
import CreateBookmarkDialog from "~/components/dialogs/CreateBookmarkDialog";
import EditTabDialog from "~/components/dialogs/EditTabDialog";
import EditFolderDialog from "~/components/dialogs/EditFolderDialog";
import EditBookmarkDialog from "~/components/dialogs/EditBookmarkDialog";
import DeleteConfirmDialog from "~/components/dialogs/DeleteConfirmDialog";
import ShareDialog from "~/components/dialogs/ShareDialog";
import MoveBookmarkDialog from "~/components/dialogs/MoveBookmarkDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SortableBookmark } from "~/components/page-ui/dashboard/SortableBookmark";
import { SortableTabItem } from "~/components/page-ui/dashboard/SortableTabItem";
import { SortableFolder } from "~/components/page-ui/dashboard/SortableFolder";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { getHostname } from "~/lib/utils";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";


export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  // 取得該使用者的 Tabs (按 sort_order 排序)
  const allTabs = (await db
    .select()
    .from(tabsSchema)
    .where(eq(tabsSchema.user_id, user.id))
    .orderBy(asc(tabsSchema.sort_order))
    .all()).map(t => ({ ...t, sort_order: t.sort_order ?? 0 }));

  // 取得該使用者的 Folders
  const allFolders = (await db
    .select()
    .from(foldersSchema)
    .where(eq(foldersSchema.user_id, user.id))
    .orderBy(asc(foldersSchema.sort_order))
    .all()).map(f => ({ ...f, is_collapsed: !!f.is_collapsed, sort_order: f.sort_order ?? 0 }));

  // 取得該使用者的 Bookmarks
  const allBookmarks = (await db
    .select()
    .from(bookmarksSchema)
    .where(eq(bookmarksSchema.user_id, user.id))
    .orderBy(asc(bookmarksSchema.sort_order))
    .all()).map(b => ({ ...b, sort_order: b.sort_order ?? 0 }));

  // 組裝樹狀結構
  const tabsWithFolders: TabWithFolders[] = (allTabs || []).map((tab) => ({
    ...tab,
    folders: buildFolderTree(
      (allFolders || []).filter((f) => f.tab_id === tab.id),
      (allBookmarks || []).filter((b) =>
        (allFolders || []).some((f) => f.id === b.folder_id && f.tab_id === tab.id)
      )
    ),
  })) as any;

  return json({ tabs: tabsWithFolders, user });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    return logout(request, context.cloudflare.env);
  }

  return json({ error: "無效的操作" }, { status: 400 });
}


export const meta: MetaFunction = () => {
  const title = "Dashboard · Kit";
  const description = "管理您的書籤收藏";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: title },
    { property: "twitter:description", content: description },
  ];
};

export default function Dashboard() {
  const { tabs, user } = useLoaderData<typeof loader>();
  const [tabsState, setTabs] = useState<TabWithFolders[]>(tabs);
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTabId = searchParams.get("tab");
  // 檢查 URL 參數中的 tab id 是否存在於目前的 tabs 中
  const activeTabId = (paramTabId && tabsState.find((t) => t.id === paramTabId))
    ? paramTabId
    : tabsState[0]?.id;

  // 如果 URL 中的 tab 無效（例如已被刪除），則更新 URL 為有效值
  useEffect(() => {
    if (paramTabId && !tabsState.find((t) => t.id === paramTabId) && tabsState.length > 0) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("tab", tabsState[0].id);
        return newParams;
      }, { replace: true, preventScrollReset: true });
    }
  }, [tabsState, paramTabId, setSearchParams]);

  // 確保 tabs 數據更新時同步（例如拖曳排序後）
  useEffect(() => {
    setTabs(tabs);
  }, [tabs]);

  const logoutFetcher = useFetcher();
  const reorderTabsFetcher = useFetcher();
  const reorderFoldersFetcher = useFetcher();
  const reorderBookmarksFetcher = useFetcher();

  // Dialog 狀態
  const [showCreateTabDialog, setShowCreateTabDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateBookmarkDialog, setShowCreateBookmarkDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);

  // 編輯 Dialog 狀態
  const [showEditTabDialog, setShowEditTabDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [showEditBookmarkDialog, setShowEditBookmarkDialog] = useState(false);
  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // 刪除 Dialog 狀態
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResource, setDeleteResource] = useState<{
    type: "tab" | "folder" | "bookmark";
    id: string;
    title: string;
  } | null>(null);

  // 分享 Dialog 狀態
  const [showShareDialog, setShowShareDialog] = useState(false);

  // 移動書籤 Dialog 狀態
  const [showMoveBookmarkDialog, setShowMoveBookmarkDialog] = useState(false);
  const [movingBookmark, setMovingBookmark] = useState<Bookmark | null>(null);
  const [movingBookmarkFolderId, setMovingBookmarkFolderId] = useState<string>("");

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle tab reorder
  const handleTabDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((items: TabWithFolders[]) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // 提交重新排序到 API
        const ids = newItems.map((item) => item.id);
        const sortOrders = newItems.map((_, index) => (index + 1) * 1000);

        reorderTabsFetcher.submit(
          {
            intent: "reorder",
            ids: JSON.stringify(ids),
            sortOrders: JSON.stringify(sortOrders),
          },
          {
            method: "post",
            action: "/api/tabs",
          }
        );

        return newItems;
      });
    }
  };

  // Handle bookmark reorder within a folder
  const handleBookmarkDragEnd = (folderId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((prevTabs: TabWithFolders[]) => {
        return prevTabs.map((tab: TabWithFolders) => {
          if (tab.id !== activeTabId) return tab;

          const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
            // 找到包含這些 bookmarks 的資料夾
            const targetFolder = folders.find((f: FolderWithChildren) => f.id === folderId);
            if (targetFolder && targetFolder.bookmarks) {
              const oldIndex = targetFolder.bookmarks.findIndex((b: Bookmark) => b.id === active.id);
              const newIndex = targetFolder.bookmarks.findIndex((b: Bookmark) => b.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1) {
                const newBookmarks = arrayMove(targetFolder.bookmarks, oldIndex, newIndex);

                // 提交到 API
                const ids = newBookmarks.map((b: Bookmark) => b.id);
                const sortOrders = newBookmarks.map((_: Bookmark, index: number) => (index + 1) * 1000);

                reorderBookmarksFetcher.submit(
                  {
                    intent: "reorder",
                    ids: JSON.stringify(ids),
                    sortOrders: JSON.stringify(sortOrders),
                  },
                  {
                    method: "post",
                    action: "/api/bookmarks",
                  }
                );

                return folders.map((f: FolderWithChildren) =>
                  f.id === folderId
                    ? { ...f, bookmarks: newBookmarks }
                    : { ...f, children: f.children ? updateFolders(f.children) : [] }
                );
              }
            }

            // 遞迴處理子資料夾
            return folders.map((f: FolderWithChildren) => ({
              ...f,
              children: f.children ? updateFolders(f.children) : [],
            }));
          };

          return {
            ...tab,
            folders: updateFolders(tab.folders),
          };
        });
      });
    }
  };

  // Handle top-level folder reorder
  const handleTopLevelFolderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((prevTabs: TabWithFolders[]) => {
        return prevTabs.map((tab: TabWithFolders) => {
          if (tab.id !== activeTabId) return tab;

          const oldIndex = tab.folders.findIndex((f: FolderWithChildren) => f.id === active.id);
          const newIndex = tab.folders.findIndex((f: FolderWithChildren) => f.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newFolders = arrayMove(tab.folders, oldIndex, newIndex);

            // 提交到 API
            const ids = newFolders.map((f: FolderWithChildren) => f.id);
            const sortOrders = newFolders.map((_: FolderWithChildren, index: number) => (index + 1) * 1000);

            reorderFoldersFetcher.submit(
              {
                intent: "reorder",
                ids: JSON.stringify(ids),
                sortOrders: JSON.stringify(sortOrders),
              },
              {
                method: "post",
                action: "/api/folders",
              }
            );

            return {
              ...tab,
              folders: newFolders,
            };
          }

          return tab;
        });
      });
    }
  };

  // Handle nested folder reorder
  const handleNestedFolderDragEnd = (parentId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((prevTabs: TabWithFolders[]) => {
        return prevTabs.map((tab: TabWithFolders) => {
          if (tab.id !== activeTabId) return tab;

          const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
            const parentFolder = folders.find((f: FolderWithChildren) => f.id === parentId);
            if (parentFolder && parentFolder.children) {
              const oldIndex = parentFolder.children.findIndex((f: FolderWithChildren) => f.id === active.id);
              const newIndex = parentFolder.children.findIndex((f: FolderWithChildren) => f.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1) {
                const newChildren = arrayMove(parentFolder.children, oldIndex, newIndex);

                // 提交到 API
                const ids = newChildren.map((f: FolderWithChildren) => f.id);
                const sortOrders = newChildren.map((_: FolderWithChildren, index: number) => (index + 1) * 1000);

                reorderFoldersFetcher.submit(
                  {
                    intent: "reorder",
                    ids: JSON.stringify(ids),
                    sortOrders: JSON.stringify(sortOrders),
                  },
                  {
                    method: "post",
                    action: "/api/folders",
                  }
                );

                return folders.map((f: FolderWithChildren) =>
                  f.id === parentId
                    ? { ...f, children: newChildren }
                    : { ...f, children: f.children ? updateFolders(f.children) : [] }
                );
              }
            }

            // 遞迴處理子資料夾
            return folders.map((f: FolderWithChildren) => ({
              ...f,
              children: f.children ? updateFolders(f.children) : [],
            }));
          };

          return {
            ...tab,
            folders: updateFolders(tab.folders),
          };
        });
      });
    }
  };

  const activeTab = tabsState.find((t) => t.id === activeTabId);

  // 獲取所有可用的資料夾（用於移動書籤）
  const allFoldersForMove = useMemo(() => {
    return activeTab?.folders || [];
  }, [activeTab]);

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-border px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
                <img src="/favicon-re.svg" alt="Kit" className="h-full w-full object-contain rounded-xl" />
              </div>
              <h1 className="text-xl font-semibold text-primary">
                Kit
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-0">
            {activeTabId && (
              <button
                onClick={() => {
                  setParentFolderId(null);
                  setShowCreateFolderDialog(true);
                }}
                className="flex items-center gap-2 px-4 py-2 mr-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <FolderPlusIcon className="w-4 h-4" />
                新增資料夾
              </button>
            )}

            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors">
                  <UserIcon className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel asChild>
                  <div className="grid grid-cols-1 gap-2 px-3 pt-1.5 pb-2 -mx-1 mb-1 border-b border-border">
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Form method="post" className="w-full">
                    <input type="hidden" name="intent" value="logout" />
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </Form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-card/70 backdrop-blur-sm border-b border-border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTabDragEnd}
        >
          <ScrollArea className="w-full">
            <div className="flex items-center gap-0 px-6">
              <SortableContext
                items={tabsState.map((t) => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                {tabsState.map((tab: TabWithFolders) => (
                  <SortableTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={activeTabId === tab.id}
                    onSelect={() => setSearchParams({ tab: tab.id }, { preventScrollReset: true })}
                    onEdit={() => {
                      setEditingTab(tab);
                      setShowEditTabDialog(true);
                    }}
                    onDelete={() => {
                      setDeleteResource({ type: "tab", id: tab.id, title: tab.title });
                      setShowDeleteDialog(true);
                    }}
                  />
                ))}
              </SortableContext>

              <button
                onClick={() => setShowCreateTabDialog(true)}
                className="px-4 py-3 text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DndContext>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative min-h-0 bg-transparent">
        <ScrollArea className="h-full w-full">
          <div className="p-6">
            {tabsState.length === 0 ? (
              // 空狀態
              <div className="flex flex-col items-center justify-center h-full">
                <BookmarkIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  還沒有任何書籤
                </h2>
                <p className="text-muted-foreground mb-6">
                  開始建立你的第一個 Tab 和資料夾吧！
                </p>
                <button
                  onClick={() => setShowCreateTabDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增 Tab
                </button>
              </div>
            ) : activeTab ? (
              // 顯示資料夾和書籤
              <div className="max-w-7xl mx-auto">
                {activeTab?.folders.length === 0 ? (
                  <div className="text-center py-12">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        此 Tab 尚無資料夾
                      </p>
                      <button
                        onClick={() => setShowCreateFolderDialog(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        新增資料夾
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Top-level Folders with Drag and Drop */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleTopLevelFolderDragEnd}
                    >
                      <SortableContext
                        items={activeTab.folders.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 gap-8 pb-12">
                          {activeTab.folders.map((folder: FolderWithChildren) => (
                            <SortableFolder
                              key={folder.id}
                              folder={folder}
                              onEdit={() => {
                                setEditingFolder(folder);
                                setShowEditFolderDialog(true);
                              }}
                              onDelete={() => {
                                setDeleteResource({ type: "folder", id: folder.id, title: folder.title });
                                setShowDeleteDialog(true);
                              }}
                              onCreateSubfolder={() => {
                                setParentFolderId(folder.id);
                                setShowCreateFolderDialog(true);
                              }}
                              onCreateBookmark={() => {
                                setSelectedFolderId(folder.id);
                                setSelectedFolderName(folder.title);
                                setShowCreateBookmarkDialog(true);
                              }}
                            >
                              {/* Folder Bookmarks */}
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleBookmarkDragEnd(folder.id)}
                              >
                                <SortableContext
                                  items={folder.bookmarks?.map((b: Bookmark) => b.id) || []}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ps-6 pr-0 -ml-6">
                                    {folder.bookmarks?.map((bookmark: Bookmark) => (
                                      <SortableBookmark
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        onEdit={() => {
                                          setEditingBookmark(bookmark);
                                          setShowEditBookmarkDialog(true);
                                        }}
                                        onDelete={() => {
                                          setDeleteResource({ type: "bookmark", id: bookmark.id, title: bookmark.title });
                                          setShowDeleteDialog(true);
                                        }}
                                        onMove={() => {
                                          setMovingBookmark(bookmark);
                                          setMovingBookmarkFolderId(bookmark.folder_id);
                                          setShowMoveBookmarkDialog(true);
                                        }}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>

                              {/* Nested Folders */}
                              {folder.children && folder.children.length > 0 && (
                                <>
                                  <hr className="mt-8" />
                                  <div className="mt-4 -mr-4">
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={handleNestedFolderDragEnd(folder.id)}
                                    >
                                      <SortableContext
                                        items={folder.children.map((f: FolderWithChildren) => f.id)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        {folder.children.map((childFolder: FolderWithChildren) => (
                                          <div key={childFolder.id}>
                                            <SortableFolder
                                              folder={childFolder}
                                              isNested={true}
                                              onEdit={() => {
                                                setEditingFolder(childFolder);
                                                setShowEditFolderDialog(true);
                                              }}
                                              onDelete={() => {
                                                setDeleteResource({ type: "folder", id: childFolder.id, title: childFolder.title });
                                                setShowDeleteDialog(true);
                                              }}
                                              onCreateSubfolder={() => {
                                                setParentFolderId(childFolder.id);
                                                setShowCreateFolderDialog(true);
                                              }}
                                              onCreateBookmark={() => {
                                                setSelectedFolderId(childFolder.id);
                                                setSelectedFolderName(childFolder.title);
                                                setShowCreateBookmarkDialog(true);
                                              }}
                                            >
                                              <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleBookmarkDragEnd(childFolder.id)}
                                              >
                                                <SortableContext
                                                  items={childFolder.bookmarks?.map((b: Bookmark) => b.id) || []}
                                                  strategy={verticalListSortingStrategy}
                                                >
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {childFolder.bookmarks?.map((bookmark: Bookmark) => (
                                                      <SortableBookmark
                                                        key={bookmark.id}
                                                        bookmark={bookmark}
                                                        onEdit={() => {
                                                          setEditingBookmark(bookmark);
                                                          setShowEditBookmarkDialog(true);
                                                        }}
                                                        onDelete={() => {
                                                          setDeleteResource({ type: "bookmark", id: bookmark.id, title: bookmark.title });
                                                          setShowDeleteDialog(true);
                                                        }}
                                                        onMove={() => {
                                                          setMovingBookmark(bookmark);
                                                          setMovingBookmarkFolderId(bookmark.folder_id);
                                                          setShowMoveBookmarkDialog(true);
                                                        }}
                                                      />
                                                    ))}
                                                  </div>
                                                </SortableContext>
                                              </DndContext>
                                            </SortableFolder>
                                          </div>
                                        ))}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                </>
                              )}
                            </SortableFolder>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </main>

      {/* Dialogs */}
      <CreateTabDialog
        open={showCreateTabDialog}
        onOpenChange={setShowCreateTabDialog}
      />
      <CreateFolderDialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        tabId={activeTabId || ""}
        parentId={parentFolderId}
      />
      <CreateBookmarkDialog
        open={showCreateBookmarkDialog}
        onOpenChange={setShowCreateBookmarkDialog}
        folderId={selectedFolderId || ""}
        folderName={selectedFolderName}
      />
      {editingTab && (
        <EditTabDialog
          open={showEditTabDialog}
          onOpenChange={setShowEditTabDialog}
          tab={editingTab}
        />
      )}
      {editingFolder && (
        <EditFolderDialog
          open={showEditFolderDialog}
          onOpenChange={setShowEditFolderDialog}
          folder={editingFolder}
        />
      )}
      {editingBookmark && (
        <EditBookmarkDialog
          open={showEditBookmarkDialog}
          onOpenChange={setShowEditBookmarkDialog}
          bookmark={editingBookmark}
        />
      )}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        resourceType={deleteResource?.type || "bookmark"}
        resourceId={deleteResource?.id || ""}
        resourceTitle={deleteResource?.title || ""}
      />
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
      <MoveBookmarkDialog
        open={showMoveBookmarkDialog}
        onOpenChange={setShowMoveBookmarkDialog}
        bookmark={movingBookmark}
        currentFolderId={movingBookmarkFolderId}
        allFolders={allFoldersForMove}
      />
    </div>
  );
}
