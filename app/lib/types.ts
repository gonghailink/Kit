export interface Workspace {
  id: string;
  title: string;
  user_id: string;
  sort_order: number | null;
  theme_primary: string | null;
  theme_background: string | null;
  theme_card: string | null;
  theme_secondary: string | null;
  theme_foreground: string | null;
  theme_font: string | null;
  theme_dark_primary: string | null;
  theme_dark_background: string | null;
  theme_dark_card: string | null;
  theme_dark_secondary: string | null;
  theme_dark_foreground: string | null;
  created_at: string;
}

// 資料庫表格型別
export type TabType = "folders" | "tags";

export interface Tab {
  id: string;
  user_id: string;
  title: string;
  type: TabType;
  sort_order: number;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  tab_id: string;
  parent_id: string | null;
  title: string;
  is_collapsed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  folder_id: string | null;
  tab_id: string | null;
  title: string;
  url: string;
  favicon_url: string | null;
  memo: string | null;
  sort_order: number;
  created_at: string;
}

export interface Share {
  id: string;
  user_id: string;
  share_token: string;
  short_link: string | null;
  name: string | null;
  extra_btn_title: string | null;
  extra_btn_url: string | null;
  created_at: string;
}

export type FilterMode = "and" | "or" | "single" | "group";

export interface TagGroup {
  id: string;
  user_id: string;
  tab_id: string;
  title: string;
  color: string | null;
  filter_mode: FilterMode;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  tag_group_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

// UI 用的巢狀結構型別
export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  bookmarks?: Bookmark[];
}

export interface TabWithFolders extends Tab {
  folders: FolderWithChildren[];
}

export interface TagGroupWithTags extends TagGroup {
  tags: Tag[];
}

export interface BookmarkWithTags extends Bookmark {
  tags: Tag[];
}

export interface TabWithTags extends Tab {
  bookmarks: BookmarkWithTags[];
  tagGroups: TagGroupWithTags[];
}

// Type guards
export function isTagsTab(tab: TabWithFolders | TabWithTags): tab is TabWithTags {
  return tab.type === "tags";
}

export function isFoldersTab(tab: TabWithFolders | TabWithTags): tab is TabWithFolders {
  return tab.type === "folders";
}

// 聯合型別
export type TabData = TabWithFolders | TabWithTags;

// API 請求/回應型別
export interface CreateTabInput {
  title: string;
  type?: TabType;
  sort_order?: number;
}

export interface CreateFolderInput {
  tab_id: string;
  parent_id?: string | null;
  title: string;
  sort_order?: number;
}

export interface CreateBookmarkInput {
  folder_id?: string;
  tab_id?: string;
  title: string;
  url: string;
  favicon_url?: string | null;
  memo?: string | null;
  sort_order?: number;
}

export interface ReorderInput {
  ids: string[];
  sort_orders: number[];
}

// 拖放型別
export type DraggableType = "tab" | "folder" | "bookmark";

export interface DragItem {
  id: string;
  type: DraggableType;
  data: Tab | Folder | Bookmark;
}
