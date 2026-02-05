// 資料庫表格型別
export interface Tab {
  id: string;
  user_id: string;
  title: string;
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
  folder_id: string;
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

// UI 用的巢狀結構型別
export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  bookmarks?: Bookmark[];
}

export interface TabWithFolders extends Tab {
  folders: FolderWithChildren[];
}

// API 請求/回應型別
export interface CreateTabInput {
  title: string;
  sort_order?: number;
}

export interface CreateFolderInput {
  tab_id: string;
  parent_id?: string | null;
  title: string;
  sort_order?: number;
}

export interface CreateBookmarkInput {
  folder_id: string;
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
