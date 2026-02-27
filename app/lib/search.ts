import type { TabData, Bookmark, FolderWithChildren, BookmarkWithTags, Tag } from "~/lib/types";
import { isFoldersTab, isTagsTab } from "~/lib/types";

export interface SearchResult {
  bookmark: Bookmark;
  tabId: string;
  tabTitle: string;
  tabType: string;
  folderPath: string;
  tags?: Tag[];
}

function collectFromFolders(
  folders: FolderWithChildren[],
  tabId: string,
  tabTitle: string,
  tabType: string,
  parentPath: string,
  out: SearchResult[]
): void {
  for (const folder of folders) {
    const path = parentPath ? `${parentPath} / ${folder.title}` : folder.title;
    if (folder.bookmarks) {
      for (const b of folder.bookmarks) {
        out.push({ bookmark: b, tabId, tabTitle, tabType, folderPath: path });
      }
    }
    if (folder.children) {
      collectFromFolders(folder.children, tabId, tabTitle, tabType, path, out);
    }
  }
}

export function extractAllBookmarks(tabs: TabData[]): SearchResult[] {
  const results: SearchResult[] = [];
  for (const tab of tabs) {
    if (isFoldersTab(tab)) {
      collectFromFolders(tab.folders, tab.id, tab.title, tab.type, "", results);
    } else if (isTagsTab(tab)) {
      for (const b of tab.bookmarks) {
        results.push({
          bookmark: b,
          tabId: tab.id,
          tabTitle: tab.title,
          tabType: tab.type,
          folderPath: "",
          tags: (b as BookmarkWithTags).tags,
        });
      }
    }
  }
  return results;
}

export function filterByQuery(results: SearchResult[], query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const keywords = trimmed.split(/\s+/);

  return results.filter((r) => {
    const tagNames = r.tags?.map((t) => t.title).join(" ") || "";
    const haystack = [
      r.bookmark.title,
      r.bookmark.url,
      r.bookmark.memo || "",
      r.folderPath,
      r.tabTitle,
      tagNames,
    ]
      .join(" ")
      .toLowerCase();

    return keywords.every((kw) => haystack.includes(kw));
  });
}
