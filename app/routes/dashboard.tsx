import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, useFetcher, Form, useSearchParams } from "react-router";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { requireAuth, logout, changePassword } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tabs as tabsSchema, folders as foldersSchema, bookmarks as bookmarksSchema, workspaces as workspacesSchema, tagGroups as tagGroupsSchema, tags as tagsSchema, bookmarkTags as bookmarkTagsSchema } from "~/drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import { buildFolderTree } from "~/lib/utils";
import type { Tab, Folder, Bookmark, TabWithFolders, FolderWithChildren, TabData, TabWithTags, BookmarkWithTags, TagGroupWithTags, Tag, Workspace } from "~/lib/types";
import { isTagsTab, isFoldersTab } from "~/lib/types";
import { BookmarkSimple as BookmarkIcon, Plus, SignOut as LogOut, DotsThreeVertical as MoreVertical, PencilSimple as Edit, Trash, DotsSixVertical as GripVertical, ShareNetwork as Share2, FolderOpen, CaretDown as ChevronDown, User as UserIcon, FolderPlus as FolderPlusIcon, GearSix as MonitorCogIcon, Gear as FolderCogIcon, Tag as TagIcon } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
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
import CreateTabDialog from "~/components/tabs/CreateTabDialog";
import CreateFolderDialog from "~/components/folders/CreateFolderDialog";
import CreateBookmarkDialog from "~/components/bookmarks/CreateBookmarkDialog";
import EditTabDialog from "~/components/tabs/EditTabDialog";
import EditFolderDialog from "~/components/folders/EditFolderDialog";
import EditBookmarkDialog from "~/components/bookmarks/EditBookmarkDialog";
import DeleteConfirmDialog from "~/components/shared/DeleteConfirmDialog";
import ShareDialog from "~/components/workspaces/ShareDialog";
import MoveBookmarkDialog from "~/components/bookmarks/MoveBookmarkDialog";
import ChangePasswordDialog from "~/components/shared/ChangePasswordDialog";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SortableBookmark } from "~/components/bookmarks/SortableBookmark";
import { BookmarkCard } from "~/components/bookmarks/BookmarkCard";
import { SortableTabItem } from "~/components/tabs/SortableTabItem";
import { SortableFolder } from "~/components/folders/SortableFolder";
import { DashboardHeader } from "~/components/layout/DashboardHeader";
import { OrganizeTabsSheet } from "~/components/tabs/OrganizeTabsSheet";
import { OrganizeFoldersSheet } from "~/components/folders/OrganizeFoldersSheet";
import { OrganizeSubFoldersSheet } from "~/components/folders/OrganizeSubFoldersSheet";
import { OrganizeWorkspacesSheet } from "~/components/workspaces/OrganizeWorkspacesSheet";
import { TagsTabContent } from "~/components/tabs/TagsTabContent";
import { ManageTagGroupsSheet } from "~/components/tags/ManageTagGroupsSheet";
import { WorkspaceSwitcher } from "~/components/workspaces/WorkspaceSwitcher";
import CreateWorkspaceDialog from "~/components/workspaces/CreateWorkspaceDialog";
import EditWorkspaceDialog from "~/components/workspaces/EditWorkspaceDialog";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { getHostname } from "~/lib/utils";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { Button } from "~/components/ui/button";


export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  const url = new URL(request.url);
  const workspaceParam = url.searchParams.get("workspace");

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
      .from(tabsSchema)
      .where(and(eq(tabsSchema.user_id, user.id), eq(tabsSchema.workspace_id, currentWorkspaceId)))
      .orderBy(asc(tabsSchema.sort_order))
      .all()).map(t => ({ ...t, sort_order: t.sort_order ?? 0 }))
    : [];

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

  // 組裝樹狀結構（依據 tab.type 分支）
  const tabsData: TabData[] = (allTabs || []).map((tab) => {
    if (tab.type === "tags") {
      // Tags 模式：書籤直接屬於 tab
      const tabBookmarks = (allBookmarks || []).filter(b => b.tab_id === tab.id);
      const tabTagGroups = (allTagGroups || []).filter(tg => tg.tab_id === tab.id);
      const tabTagGroupIds = new Set(tabTagGroups.map(tg => tg.id));

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
      // Folders 模式：現有邏輯
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

  return {
    tabs: tabsData,
    user,
    workspaces: allWorkspaces,
    currentWorkspaceId: currentWorkspaceId || null
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    return logout(request, context.cloudflare.env);
  }

  if (intent === "change-password") {
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!oldPassword || !newPassword) {
      return data({ error: "密碼不得為空" }, { status: 400 });
    }

    const result = await changePassword(user.id, oldPassword, newPassword, context.cloudflare.env);
    if (result.error) {
      return data({ error: result.error }, { status: 400 });
    }
    return { success: true };
  }

  return data({ error: "無效的操作" }, { status: 400 });
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
    { property: "og:image", content: "/meta.png" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: title },
    { property: "twitter:description", content: description },
    { property: "twitter:image", content: "/meta.png" },
  ];
};

// Recursive component for rendering nested folders at any depth
function NestedFolders({
  folders: nestedFolders,
  parentId,
  sensors,
  activeDragBookmark,
  handleNestedFolderDragEnd,
  handleBookmarkDragStart,
  getBookmarkDragEndHandler,
  handleBookmarkDragCancel,
  handleEditBookmark,
  handleDeleteBookmark,
  handleMoveBookmark,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  onCreateBookmark,
  onOrganizeSubfolders,
}: {
  folders: FolderWithChildren[];
  parentId: string;
  sensors: ReturnType<typeof useSensors>;
  activeDragBookmark: Bookmark | null;
  handleNestedFolderDragEnd: (parentId: string) => (event: DragEndEvent) => void;
  handleBookmarkDragStart: (event: DragStartEvent) => void;
  getBookmarkDragEndHandler: (folderId: string) => (event: DragEndEvent) => void;
  handleBookmarkDragCancel: () => void;
  handleEditBookmark: (bookmark: Bookmark) => void;
  handleDeleteBookmark: (bookmark: Bookmark) => void;
  handleMoveBookmark: (bookmark: Bookmark) => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folder: FolderWithChildren) => void;
  onCreateSubfolder: (folder: FolderWithChildren) => void;
  onCreateBookmark: (folder: FolderWithChildren) => void;
  onOrganizeSubfolders: (folder: FolderWithChildren) => void;
}) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleNestedFolderDragEnd(parentId)}
    >
      <SortableContext
        items={nestedFolders.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {nestedFolders.map((childFolder) => (
          <div key={childFolder.id}>
            <SortableFolder
              folder={childFolder}
              isNested={true}
              onEdit={() => onEditFolder(childFolder)}
              onDelete={() => onDeleteFolder(childFolder)}
              onCreateSubfolder={() => onCreateSubfolder(childFolder)}
              onCreateBookmark={() => onCreateBookmark(childFolder)}
              onOrganizeSubfolders={() => onOrganizeSubfolders(childFolder)}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleBookmarkDragStart}
                onDragEnd={getBookmarkDragEndHandler(childFolder.id)}
                onDragCancel={handleBookmarkDragCancel}
              >
                <SortableContext
                  items={childFolder.bookmarks?.map((b) => b.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {childFolder.bookmarks?.map((bookmark) => (
                      <SortableBookmark
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={handleEditBookmark}
                        onDelete={handleDeleteBookmark}
                        onMove={handleMoveBookmark}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragBookmark ? (
                    <BookmarkCard bookmark={activeDragBookmark} />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Recurse into deeper children */}
              {childFolder.children && childFolder.children.length > 0 && (
                <>
                  <hr className="mt-8" />
                  <div className="mt-4 -mr-4">
                    <NestedFolders
                      folders={childFolder.children}
                      parentId={childFolder.id}
                      sensors={sensors}
                      activeDragBookmark={activeDragBookmark}
                      handleNestedFolderDragEnd={handleNestedFolderDragEnd}
                      handleBookmarkDragStart={handleBookmarkDragStart}
                      getBookmarkDragEndHandler={getBookmarkDragEndHandler}
                      handleBookmarkDragCancel={handleBookmarkDragCancel}
                      handleEditBookmark={handleEditBookmark}
                      handleDeleteBookmark={handleDeleteBookmark}
                      handleMoveBookmark={handleMoveBookmark}
                      onEditFolder={onEditFolder}
                      onDeleteFolder={onDeleteFolder}
                      onCreateSubfolder={onCreateSubfolder}
                      onCreateBookmark={onCreateBookmark}
                      onOrganizeSubfolders={onOrganizeSubfolders}
                    />
                  </div>
                </>
              )}
            </SortableFolder>
          </div>
        ))}
      </SortableContext>
    </DndContext>
  );
}

export default function Dashboard() {
  const { tabs, user, workspaces, currentWorkspaceId } = useLoaderData<typeof loader>();
  const [tabsState, setTabs] = useState<TabData[]>(tabs as unknown as TabData[]);
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

  useEffect(() => {
    if (activeTabId) {
      const activeTabElement = document.getElementById(`tab-${activeTabId}`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTabId]);

  const logoutFetcher = useFetcher();
  const reorderTabsFetcher = useFetcher();
  const reorderFoldersFetcher = useFetcher();
  const reorderBookmarksFetcher = useFetcher();
  const reorderWorkspacesFetcher = useFetcher();

  // 確保 tabs 數據更新時同步，但排序進行中時跳過（避免覆蓋 optimistic update）
  const isReordering =
    reorderBookmarksFetcher.state !== "idle" ||
    reorderFoldersFetcher.state !== "idle" ||
    reorderTabsFetcher.state !== "idle";
  useEffect(() => {
    if (!isReordering) {
      setTabs(tabs as unknown as TabData[]);
    }
  }, [tabs, isReordering]);

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
    type: "tab" | "folder" | "bookmark" | "workspace";
    id: string;
    title: string;
  } | null>(null);

  // 分享 Dialog 狀態
  const [showShareDialog, setShowShareDialog] = useState(false);

  // 修改密碼 Dialog 狀態
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  // 移動書籤 Dialog 狀態
  const [showMoveBookmarkDialog, setShowMoveBookmarkDialog] = useState(false);
  const [movingBookmark, setMovingBookmark] = useState<Bookmark | null>(null);
  const [movingBookmarkFolderId, setMovingBookmarkFolderId] = useState<string>("");

  // DragOverlay 狀態（folders 模式書籤拖動）
  const [activeDragBookmarkId, setActiveDragBookmarkId] = useState<string | null>(null);

  // 整理列表 Sheet 狀態
  const [showOrganizeTabsSheet, setShowOrganizeTabsSheet] = useState(false);

  // 整理資料夾 Sheet 狀態
  const [showOrganizeFoldersSheet, setShowOrganizeFoldersSheet] = useState(false);

  // 整理子資料夾 Sheet 狀態
  const [showOrganizeSubFoldersSheet, setShowOrganizeSubFoldersSheet] = useState(false);
  const [organizingSubFoldersParent, setOrganizingSubFoldersParent] = useState<FolderWithChildren | null>(null);

  // Workspace Dialog 狀態
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = useState(false);
  const [showEditWorkspaceDialog, setShowEditWorkspaceDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  // 整理工作區 Sheet 狀態
  const [showOrganizeWorkspacesSheet, setShowOrganizeWorkspacesSheet] = useState(false);

  // 管理標籤群組 Sheet 狀態（Tags 模式）
  const [showManageTagGroupsSheet, setShowManageTagGroupsSheet] = useState(false);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle workspace reorder
  const handleWorkspaceReorder = (newWorkspaces: Workspace[]) => {
    // 提交重新排序到 API
    const ids = newWorkspaces.map((item) => item.id);
    const sortOrders = newWorkspaces.map((_, index) => (index + 1) * 1000);

    reorderWorkspacesFetcher.submit(
      {
        intent: "reorder",
        ids: JSON.stringify(ids),
        sortOrders: JSON.stringify(sortOrders),
      },
      {
        method: "post",
        action: "/api/workspaces",
      }
    );
  };

  // Handle tab reorder
  const handleTabReorder = (newTabs: TabData[]) => {
    setTabs(newTabs);

    // 提交重新排序到 API
    const ids = newTabs.map((item) => item.id);
    const sortOrders = newTabs.map((_, index) => (index + 1) * 1000);

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
  };

  // DragOverlay 回調
  const handleBookmarkDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragBookmarkId(event.active.id as string);
  }, []);

  const handleBookmarkDragCancel = useCallback(() => {
    setActiveDragBookmarkId(null);
  }, []);

  const activeDragBookmark = activeDragBookmarkId
    ? (() => {
      const tab = tabsState.find((t: TabData) => t.id === activeTabId);
      if (tab && isFoldersTab(tab)) {
        const find = (folders: FolderWithChildren[]): Bookmark | undefined => {
          for (const f of folders) {
            const b = f.bookmarks?.find((b: Bookmark) => b.id === activeDragBookmarkId);
            if (b) return b;
            if (f.children) { const c = find(f.children); if (c) return c; }
          }
          return undefined;
        };
        return find(tab.folders);
      }
      return undefined;
    })()
    : undefined;

  // 穩定的書籤操作回調（避免 inline arrow 導致 SortableBookmark memo 失效）
  const findBookmarkInFolders = useCallback((folders: FolderWithChildren[], id: string): Bookmark | undefined => {
    for (const folder of folders) {
      const found = folder.bookmarks?.find((b: Bookmark) => b.id === id);
      if (found) return found;
      if (folder.children) {
        const childFound = findBookmarkInFolders(folder.children, id);
        if (childFound) return childFound;
      }
    }
    return undefined;
  }, []);

  const handleEditBookmark = useCallback((bookmarkId: string) => {
    const tab = tabsState.find((t: TabData) => t.id === activeTabId);
    if (!tab) return;
    let bookmark: Bookmark | undefined;
    if (isFoldersTab(tab)) {
      bookmark = findBookmarkInFolders(tab.folders, bookmarkId);
    } else if (isTagsTab(tab)) {
      bookmark = tab.bookmarks.find((b: BookmarkWithTags) => b.id === bookmarkId);
    }
    if (bookmark) {
      setEditingBookmark(bookmark);
      setShowEditBookmarkDialog(true);
    }
  }, [tabsState, activeTabId, findBookmarkInFolders]);

  const handleDeleteBookmark = useCallback((bookmarkId: string) => {
    const tab = tabsState.find((t: TabData) => t.id === activeTabId);
    if (!tab) return;
    let bookmark: Bookmark | undefined;
    if (isFoldersTab(tab)) {
      bookmark = findBookmarkInFolders(tab.folders, bookmarkId);
    } else if (isTagsTab(tab)) {
      bookmark = tab.bookmarks.find((b: BookmarkWithTags) => b.id === bookmarkId);
    }
    if (bookmark) {
      setDeleteResource({ type: "bookmark", id: bookmark.id, title: bookmark.title });
      setShowDeleteDialog(true);
    }
  }, [tabsState, activeTabId, findBookmarkInFolders]);

  const handleMoveBookmark = useCallback((bookmarkId: string) => {
    const tab = tabsState.find((t: TabData) => t.id === activeTabId);
    if (!tab) return;
    let bookmark: Bookmark | undefined;
    if (isFoldersTab(tab)) {
      bookmark = findBookmarkInFolders(tab.folders, bookmarkId);
    }
    if (bookmark) {
      setMovingBookmark(bookmark);
      setMovingBookmarkFolderId(bookmark.folder_id || "");
      setShowMoveBookmarkDialog(true);
    }
  }, [tabsState, activeTabId, findBookmarkInFolders]);

  // Handle bookmark reorder within a folder（穩定引用，避免每次 render 建新函式）
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const bookmarkDragEndHandlers = useRef(new Map<string, (event: DragEndEvent) => void>());

  const getBookmarkDragEndHandler = useCallback((folderId: string) => {
    let handler = bookmarkDragEndHandlers.current.get(folderId);
    if (handler) return handler;

    handler = (event: DragEndEvent) => {
      setActiveDragBookmarkId(null);
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setTabs((prevTabs: TabData[]) => {
          return prevTabs.map((tab: TabData) => {
            if (tab.id !== activeTabIdRef.current || !isFoldersTab(tab)) return tab;

            const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
              const targetFolder = folders.find((f: FolderWithChildren) => f.id === folderId);
              if (targetFolder && targetFolder.bookmarks) {
                const oldIndex = targetFolder.bookmarks.findIndex((b: Bookmark) => b.id === active.id);
                const newIndex = targetFolder.bookmarks.findIndex((b: Bookmark) => b.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                  const newBookmarks = arrayMove(targetFolder.bookmarks, oldIndex, newIndex);

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
    bookmarkDragEndHandlers.current.set(folderId, handler);
    return handler;
  }, [reorderBookmarksFetcher]);

  // Handle top-level folder reorder via Sheet
  const handleTopLevelFolderReorder = (newFolders: FolderWithChildren[]) => {
    setTabs((prevTabs: TabData[]) => {
      return prevTabs.map((tab: TabData) => {
        if (tab.id !== activeTabId || !isFoldersTab(tab)) return tab;

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
      });
    });
  };

  // Handle subfolder reorder via Sheet
  const handleSubFolderReorder = (parentId: string, newChildren: FolderWithChildren[]) => {
    setTabs((prevTabs: TabData[]) => {
      return prevTabs.map((tab: TabData) => {
        if (tab.id !== activeTabId || !isFoldersTab(tab)) return tab;

        const updateFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
          return folders.map((f: FolderWithChildren) => {
            if (f.id === parentId) {
              return { ...f, children: newChildren };
            }
            if (f.children) {
              return { ...f, children: updateFolders(f.children) };
            }
            return f;
          });
        };

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

        return {
          ...tab,
          folders: updateFolders(tab.folders),
        };
      });
    });
  };

  // Handle nested folder reorder
  const handleNestedFolderDragEnd = (parentId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((prevTabs: TabData[]) => {
        return prevTabs.map((tab: TabData) => {
          if (tab.id !== activeTabId || !isFoldersTab(tab)) return tab;

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
  const activeFoldersTab = activeTab && isFoldersTab(activeTab) ? activeTab : null;
  const activeTagsTab = activeTab && isTagsTab(activeTab) ? activeTab : null;

  // 獲取所有可用的資料夾（用於移動書籤）
  const allFoldersForMove = useMemo(() => {
    return activeFoldersTab?.folders || [];
  }, [activeFoldersTab]);

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Header */}
      <DashboardHeader
        userEmail={user.email}
        onShare={() => setShowShareDialog(true)}
        onChangePassword={() => setShowChangePasswordDialog(true)}
        workspaceSwitcher={
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId || ""}
            onWorkspaceChange={(workspaceId) => {
              setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev);
                newParams.set("workspace", workspaceId);
                // 當切換 workspace 時，清除 tab 參數讓它自動選擇第一個 tab
                newParams.delete("tab");
                return newParams;
              }, { preventScrollReset: true });
            }}
            onManageWorkspaces={() => setShowOrganizeWorkspacesSheet(true)}
            allowEdit={true}
          />
        }
      />

      {/* Tabs Bar */}
      <div className="flex flex-col backdrop-blur-sm border-b border-border">
        <div className="flex ps-6">
          {/* Tab 管理按鈕 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowOrganizeTabsSheet(true)}
              className="flex items-center gap-1.5 px-3 py-2  text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors"
            >
              <MonitorCogIcon className="w-4 h-4" />
              <span className="hidden md:block">管理 Tabs</span>
            </button>
            <div className="h-4 w-[1px] bg-muted-foreground/20 mr-2"></div>
          </div>
          <div className="flex-1 min-w-0">
            <ScrollArea className="w-full pt-2 pb-3 pr-6">
              <div className="flex items-center gap-0">
                {tabsState.map((tab: TabData) => (
                  <SortableTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={activeTabId === tab.id}
                    onSelect={() => setSearchParams((prev) => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set("tab", tab.id);
                      return newParams;
                    }, { preventScrollReset: true })}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="flex-1 relative min-h-0 bg-transparent">
        <div className="h-full w-full overflow-auto">
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
            ) : activeTab && activeFoldersTab ? (
              // Folders 模式：顯示資料夾和書籤
              <div className="max-w-7xl min-h-[80vh] mx-auto">
                {activeFoldersTab.folders.length === 0 ? (
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
                    {/* Top-level Folders */}
                    <div className="grid grid-cols-1 gap-8 pb-16">
                      {activeFoldersTab.folders.map((folder: FolderWithChildren) => (
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
                          onOrganizeSubfolders={() => {
                            setOrganizingSubFoldersParent(folder);
                            setShowOrganizeSubFoldersSheet(true);
                          }}
                        >
                          {/* Folder Bookmarks */}
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleBookmarkDragStart}
                            onDragEnd={getBookmarkDragEndHandler(folder.id)}
                            onDragCancel={handleBookmarkDragCancel}
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
                                    onEdit={handleEditBookmark}
                                    onDelete={handleDeleteBookmark}
                                    onMove={handleMoveBookmark}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                            <DragOverlay>
                              {activeDragBookmark ? (
                                <BookmarkCard bookmark={activeDragBookmark} />
                              ) : null}
                            </DragOverlay>
                          </DndContext>

                          {/* Nested Folders (recursive) */}
                          {folder.children && folder.children.length > 0 && (
                            <>
                              <hr className="mt-8" />
                              <div className="mt-4 -mr-4">
                                <NestedFolders
                                  folders={folder.children}
                                  parentId={folder.id}
                                  sensors={sensors}
                                  activeDragBookmark={activeDragBookmark}
                                  handleNestedFolderDragEnd={handleNestedFolderDragEnd}
                                  handleBookmarkDragStart={handleBookmarkDragStart}
                                  getBookmarkDragEndHandler={getBookmarkDragEndHandler}
                                  handleBookmarkDragCancel={handleBookmarkDragCancel}
                                  handleEditBookmark={handleEditBookmark}
                                  handleDeleteBookmark={handleDeleteBookmark}
                                  handleMoveBookmark={handleMoveBookmark}
                                  onEditFolder={(f) => { setEditingFolder(f); setShowEditFolderDialog(true); }}
                                  onDeleteFolder={(f) => { setDeleteResource({ type: "folder", id: f.id, title: f.title }); setShowDeleteDialog(true); }}
                                  onCreateSubfolder={(f) => { setParentFolderId(f.id); setShowCreateFolderDialog(true); }}
                                  onCreateBookmark={(f) => { setSelectedFolderId(f.id); setSelectedFolderName(f.title); setShowCreateBookmarkDialog(true); }}
                                  onOrganizeSubfolders={(f) => { setOrganizingSubFoldersParent(f); setShowOrganizeSubFoldersSheet(true); }}
                                />
                              </div>
                            </>
                          )}
                        </SortableFolder>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab && activeTagsTab ? (
              // Tags 模式：顯示書籤和標籤
              <TagsTabContent
                tab={activeTagsTab}
                onCreateBookmark={() => {
                  setShowCreateBookmarkDialog(true);
                }}
                onEditBookmark={handleEditBookmark}
                onDeleteBookmark={handleDeleteBookmark}
              />
            ) : null}
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      {activeTabId && activeFoldersTab && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <button
            onClick={() => setShowOrganizeFoldersSheet(true)}
            className="flex items-center justify-center w-12 h-12 bg-card/90 hover:bg-card text-foreground rounded-full shadow-lg border border-border transition-colors"
            title="排序資料夾"
          >
            <FolderCogIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setParentFolderId(null);
              setShowCreateFolderDialog(true);
            }}
            className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-colors"
            title="新增資料夾"
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      {activeTabId && activeTagsTab && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <button
            onClick={() => setShowManageTagGroupsSheet(true)}
            className="flex items-center justify-center w-12 h-12 bg-card/90 hover:bg-card text-foreground rounded-full shadow-lg border border-border transition-colors"
            title="管理標籤"
          >
            <TagIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateBookmarkDialog(true)}
            className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-colors"
            title="新增書籤"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dialogs */}
      <CreateWorkspaceDialog
        open={showCreateWorkspaceDialog}
        onOpenChange={setShowCreateWorkspaceDialog}
      />
      {editingWorkspace && (
        <EditWorkspaceDialog
          open={showEditWorkspaceDialog}
          onOpenChange={setShowEditWorkspaceDialog}
          workspace={editingWorkspace}
        />
      )}
      <CreateTabDialog
        open={showCreateTabDialog}
        onOpenChange={setShowCreateTabDialog}
        workspaceId={currentWorkspaceId || ""}
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
        folderId={selectedFolderId || undefined}
        folderName={selectedFolderName}
        tabId={activeTagsTab ? activeTagsTab.id : undefined}
        tabName={activeTagsTab ? activeTagsTab.title : undefined}
        tagGroups={activeTagsTab ? activeTagsTab.tagGroups : undefined}
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
          tagGroups={activeTagsTab ? activeTagsTab.tagGroups : undefined}
          bookmarkTagIds={
            activeTagsTab
              ? (activeTagsTab.bookmarks.find((b) => b.id === editingBookmark.id) as BookmarkWithTags | undefined)?.tags.map((t) => t.id)
              : undefined
          }
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
        workspaceId={currentWorkspaceId || ""}
      />
      <MoveBookmarkDialog
        open={showMoveBookmarkDialog}
        onOpenChange={setShowMoveBookmarkDialog}
        bookmark={movingBookmark}
        currentFolderId={movingBookmarkFolderId}
        allFolders={allFoldersForMove}
      />
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />
      <OrganizeTabsSheet
        open={showOrganizeTabsSheet}
        onOpenChange={setShowOrganizeTabsSheet}
        tabs={tabsState}
        onReorder={handleTabReorder}
        onAddTab={() => setShowCreateTabDialog(true)}
        onEditTab={(tab) => {
          setEditingTab(tab);
          setShowEditTabDialog(true);
        }}
        onDeleteTab={(tab) => {
          setDeleteResource({ type: "tab", id: tab.id, title: tab.title });
          setShowDeleteDialog(true);
        }}
      />
      <OrganizeFoldersSheet
        open={showOrganizeFoldersSheet}
        onOpenChange={setShowOrganizeFoldersSheet}
        folders={activeFoldersTab?.folders || []}
        onReorder={handleTopLevelFolderReorder}
      />
      <OrganizeSubFoldersSheet
        open={showOrganizeSubFoldersSheet}
        onOpenChange={setShowOrganizeSubFoldersSheet}
        parentFolder={organizingSubFoldersParent}
        onReorder={handleSubFolderReorder}
      />
      <OrganizeWorkspacesSheet
        open={showOrganizeWorkspacesSheet}
        onOpenChange={setShowOrganizeWorkspacesSheet}
        workspaces={workspaces}
        onReorder={handleWorkspaceReorder}
        onAddWorkspace={() => setShowCreateWorkspaceDialog(true)}
        onEditWorkspace={(workspace) => {
          setEditingWorkspace(workspace);
          setShowEditWorkspaceDialog(true);
        }}
        onDeleteWorkspace={(workspace) => {
          setDeleteResource({ type: "workspace", id: workspace.id, title: workspace.title });
          setShowDeleteDialog(true);
        }}
      />
      {activeTagsTab && (
        <ManageTagGroupsSheet
          open={showManageTagGroupsSheet}
          onOpenChange={setShowManageTagGroupsSheet}
          tabId={activeTagsTab.id}
          tagGroups={activeTagsTab.tagGroups}
        />
      )}
    </div>
  );
}
