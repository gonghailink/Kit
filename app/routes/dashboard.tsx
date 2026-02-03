import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useState, useMemo } from "react";
import { createSupabaseServerClient, requireAuth } from "~/lib/supabase.server";
import { buildFolderTree } from "~/lib/utils";
import type { Tab, Folder, Bookmark, TabWithFolders, FolderWithChildren } from "~/lib/types";
import { Bookmark as BookmarkIcon, Plus, LogOut, MoreVertical, Edit, Trash2, GripVertical, Share2, FolderOpen, ChevronDown } from "lucide-react";
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

// Sortable Bookmark Component
function SortableBookmark({
  bookmark,
  onEdit,
  onDelete,
  onMove,
}: {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all group"
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
            <img
              src={bookmark.favicon_url || "/default-favicon.svg"}
              alt=""
              className="w-5 h-5 flex-shrink-0 rounded-sm"
              onError={(e) => {
                e.currentTarget.src = "/default-favicon.svg";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate group-hover:text-primary">
              {bookmark.title}
            </h4>
            {bookmark.memo && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {bookmark.memo}
              </p>
            )}
            <p className="text-xs text-muted-foreground/80 truncate mt-1">
              {getHostname(bookmark.url)}
            </p>
          </div>
        </div>
      </a>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1 bg-background/70 border border-border rounded hover:bg-secondary/60"
            >
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <FolderOpen className="w-4 h-4" />
              移動到資料夾
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Sortable Tab Component
function SortableTabItem({
  tab,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center">
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button
        onClick={onSelect}
        className={`
          px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
          ${isActive
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
          }
        `}
      >
        {tab.title}
      </button>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-secondary/60 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Sortable Folder Component
function SortableFolder({
  folder,
  isNested = false,
  onEdit,
  onDelete,
  onCreateSubfolder,
  onCreateBookmark,
  children,
}: {
  folder: FolderWithChildren;
  isNested?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCreateSubfolder: () => void;
  onCreateBookmark: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card/85 rounded-xl p-6">
      <div className="group flex items-center justify-between mb-4 -ml-7">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h2 className={`${isNested ? 'text-md font-medium text-muted-foreground' : 'text-lg font-semibold text-foreground'}`}>
            {isNested ? `→ ${folder.title}` : folder.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isNested && (
            <button
              onClick={onCreateBookmark}
              className="text-muted-foreground hover:text-foreground"
              title="新增書籤"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className={`${isNested ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateSubfolder}>
                <Plus className="w-4 h-4" />
                新增子資料夾
              </DropdownMenuItem>
              {isNested && (
                <DropdownMenuItem onClick={onCreateBookmark}>
                  <Plus className="w-4 h-4" />
                  新增書籤
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4" />
                編輯
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { tabs: initialTabs, user } = useLoaderData<typeof loader>();
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

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
      setTabs((items) => {
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
      setTabs((prevTabs) => {
        return prevTabs.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
            // 找到包含這些 bookmarks 的資料夾
            const targetFolder = folders.find((f) => f.id === folderId);
            if (targetFolder && targetFolder.bookmarks) {
              const oldIndex = targetFolder.bookmarks.findIndex((b) => b.id === active.id);
              const newIndex = targetFolder.bookmarks.findIndex((b) => b.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1) {
                const newBookmarks = arrayMove(targetFolder.bookmarks, oldIndex, newIndex);

                // 提交到 API
                const ids = newBookmarks.map((b) => b.id);
                const sortOrders = newBookmarks.map((_, index) => (index + 1) * 1000);

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

                return folders.map((f) =>
                  f.id === folderId
                    ? { ...f, bookmarks: newBookmarks }
                    : { ...f, children: f.children ? updateFolders(f.children) : [] }
                );
              }
            }

            // 遞迴處理子資料夾
            return folders.map((f) => ({
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
      setTabs((prevTabs) => {
        return prevTabs.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const oldIndex = tab.folders.findIndex((f) => f.id === active.id);
          const newIndex = tab.folders.findIndex((f) => f.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newFolders = arrayMove(tab.folders, oldIndex, newIndex);

            // 提交到 API
            const ids = newFolders.map((f) => f.id);
            const sortOrders = newFolders.map((_, index) => (index + 1) * 1000);

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
      setTabs((prevTabs) => {
        return prevTabs.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
            const parentFolder = folders.find((f) => f.id === parentId);
            if (parentFolder && parentFolder.children) {
              const oldIndex = parentFolder.children.findIndex((f) => f.id === active.id);
              const newIndex = parentFolder.children.findIndex((f) => f.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1) {
                const newChildren = arrayMove(parentFolder.children, oldIndex, newIndex);

                // 提交到 API
                const ids = newChildren.map((f) => f.id);
                const sortOrders = newChildren.map((_, index) => (index + 1) * 1000);

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

                return folders.map((f) =>
                  f.id === parentId
                    ? { ...f, children: newChildren }
                    : { ...f, children: f.children ? updateFolders(f.children) : [] }
                );
              }
            }

            // 遞迴處理子資料夾
            return folders.map((f) => ({
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

  const activeTab = tabs.find((t) => t.id === activeTabId);



  // 獲取所有可用的資料夾（用於移動書籤）
  const allFolders = useMemo(() => {
    return activeTab?.folders || [];
  }, [activeTab]);

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
                <img src="/favicon-white.svg" alt="Kit" className="h-full w-full object-contain p-[1px] rounded-xl" />
              </div>
              <h1 className="text-xl font-semibold text-primary">
                Kit
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                  {user.email}
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
      <div className="bg-card/70 backdrop-blur-sm border-b border-border px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTabDragEnd}
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            <SortableContext
              items={tabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              {tabs.map((tab) => (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  onSelect={() => setActiveTabId(tab.id)}
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
        </DndContext>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {tabs.length === 0 ? (
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
              建立 Tab
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
                    建立資料夾
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
                    items={activeTab?.folders.map((f) => f.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-8">
                      {activeTab?.folders.map((folder) => (
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
                          {/* Bookmarks Grid */}
                          {folder.bookmarks && folder.bookmarks.length > 0 ? (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleBookmarkDragEnd(folder.id)}
                            >
                              <SortableContext items={folder.bookmarks.map((b) => b.id)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {folder.bookmarks.map((bookmark) => (
                                    <SortableBookmark
                                      key={bookmark.id}
                                      bookmark={bookmark}
                                      onEdit={() => {
                                        setEditingBookmark(bookmark);
                                        setShowEditBookmarkDialog(true);
                                      }}
                                      onMove={() => {
                                        setMovingBookmark(bookmark);
                                        setMovingBookmarkFolderId(folder.id);
                                        setShowMoveBookmarkDialog(true);
                                      }}
                                      onDelete={() => {
                                        setDeleteResource({ type: "bookmark", id: bookmark.id, title: bookmark.title });
                                        setShowDeleteDialog(true);
                                      }}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="text-center py-8 bg-secondary/50 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                此資料夾尚無書籤
                              </p>
                            </div>
                          )}

                          {/* Nested Folders with Drag and Drop */}
                          {folder.children && folder.children.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleNestedFolderDragEnd(folder.id)}
                            >
                              <SortableContext
                                items={folder.children.map((f) => f.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="mt-6 ml-0 space-y-0">
                                  {folder.children.map((childFolder) => (
                                    <SortableFolder
                                      key={childFolder.id}
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
                                      {childFolder.bookmarks && childFolder.bookmarks.length > 0 && (
                                        <DndContext
                                          sensors={sensors}
                                          collisionDetection={closestCenter}
                                          onDragEnd={handleBookmarkDragEnd(childFolder.id)}
                                        >
                                          <SortableContext items={childFolder.bookmarks.map((b) => b.id)}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                              {childFolder.bookmarks.map((bookmark) => (
                                                <SortableBookmark
                                                  key={bookmark.id}
                                                  bookmark={bookmark}
                                                  onEdit={() => {
                                                    setEditingBookmark(bookmark);
                                                    setShowEditBookmarkDialog(true);
                                                  }}
                                                  onMove={() => {
                                                    setMovingBookmark(bookmark);
                                                    setMovingBookmarkFolderId(childFolder.id);
                                                    setShowMoveBookmarkDialog(true);
                                                  }}
                                                  onDelete={() => {
                                                    setDeleteResource({ type: "bookmark", id: bookmark.id, title: bookmark.title });
                                                    setShowDeleteDialog(true);
                                                  }}
                                                />
                                              ))}
                                            </div>
                                          </SortableContext>
                                        </DndContext>
                                      )}
                                    </SortableFolder>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </SortableFolder>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* 新增資料夾按鈕 */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      setParentFolderId(null);
                      setShowCreateFolderDialog(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-card/70 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-secondary/40 transition-colors text-muted-foreground"
                  >
                    <Plus className="w-5 h-5" />
                    新增資料夾
                  </button>
                </div>
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
          onOpenChange={(open) => {
            setShowCreateFolderDialog(open);
            if (!open) {
              setParentFolderId(null);
            }
          }}
          tabId={activeTabId}
          parentId={parentFolderId}
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

      {/* Edit Dialogs */}
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

      {/* Delete Dialog */}
      {deleteResource && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          resourceType={deleteResource.type}
          resourceId={deleteResource.id}
          resourceTitle={deleteResource.title}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      {/* Move Bookmark Dialog */}
      {movingBookmark && (
        <MoveBookmarkDialog
          bookmark={movingBookmark}
          allFolders={allFolders}
          currentFolderId={movingBookmarkFolderId}
          open={showMoveBookmarkDialog}
          onOpenChange={setShowMoveBookmarkDialog}
        />
      )}
    </div>
  );
}
