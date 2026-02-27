import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 從 URL 取得 hostname
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// 從 URL 取得 favicon
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch {
    return "/default-favicon.svg";
  }
}

// 建立資料夾樹狀結構
export function buildFolderTree(
  folders: import("./types").Folder[],
  bookmarks: import("./types").Bookmark[]
): import("./types").FolderWithChildren[] {
  const folderMap = new Map<string, import("./types").FolderWithChildren>();
  const rootFolders: import("./types").FolderWithChildren[] = [];

  // 初始化所有資料夾
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      bookmarks: bookmarks
        .filter((b) => b.folder_id === folder.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    });
  });

  // 建立樹狀結構
  folders
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!;

      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children?.push(folderNode);
        } else {
          // 如果找不到父資料夾，放到根層級
          rootFolders.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

  return rootFolders;
}

// 計算新的 sort_order (在兩個項目之間插入)
export function calculateNewSortOrder(
  prevOrder: number | null,
  nextOrder: number | null
): number {
  if (prevOrder === null && nextOrder === null) {
    return 1000; // 第一個項目
  }
  if (prevOrder === null) {
    return nextOrder! - 1000;
  }
  if (nextOrder === null) {
    return prevOrder + 1000;
  }
  return (prevOrder + nextOrder) / 2;
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "剛剛";
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 驗證 URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 書籤分組
export interface BookmarkGroup {
  tag: import("./types").Tag | null;
  label: string;
  color: string | null;
  bookmarks: import("./types").BookmarkWithTags[];
}

export function groupBookmarksByTagGroup(
  bookmarks: import("./types").BookmarkWithTags[],
  groupTagGroup: import("./types").TagGroupWithTags
): BookmarkGroup[] {
  const groups: BookmarkGroup[] = [];

  for (const tag of groupTagGroup.tags) {
    const matching = bookmarks.filter(b =>
      b.tags.some(t => t.id === tag.id)
    );

    if (matching.length > 0) {
      groups.push({
        tag,
        label: tag.title,
        color: groupTagGroup.color,
        bookmarks: matching,
      });
    }
  }

  // 未分類：沒有任何 group tag 的書籤
  const groupTagIds = new Set(groupTagGroup.tags.map(t => t.id));
  const uncategorized = bookmarks.filter(b =>
    !b.tags.some(t => groupTagIds.has(t.id))
  );
  if (uncategorized.length > 0) {
    groups.push({
      tag: null,
      label: "未分類",
      color: null,
      bookmarks: uncategorized,
    });
  }

  return groups;
}
