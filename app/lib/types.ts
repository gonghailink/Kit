// 資料庫表格型別 (對應你的 Supabase Schema)
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

// Supabase Database 型別定義
export interface Database {
  public: {
    Tables: {
      tabs: {
        Row: Tab;
        Insert: Omit<Tab, "id" | "created_at">;
        Update: Partial<Omit<Tab, "id" | "user_id" | "created_at">>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, "id" | "created_at">;
        Update: Partial<Omit<Folder, "id" | "user_id" | "created_at">>;
      };
      bookmarks: {
        Row: Bookmark;
        Insert: Omit<Bookmark, "id" | "created_at">;
        Update: Partial<Omit<Bookmark, "id" | "user_id" | "created_at">>;
      };
      shares: {
        Row: Share;
        Insert: Omit<Share, "id" | "created_at">;
        Update: Partial<Omit<Share, "id" | "user_id" | "created_at">>;
      };
    };
  };
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
