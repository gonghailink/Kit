import type { TabData, TabWithFolders, TabWithTags, FolderWithChildren, Bookmark, BookmarkWithTags, TagGroup, TagGroupWithTags, Tag } from "./types";
import { isTagsTab, isFoldersTab } from "./types";

// === Export Types ===

export interface ExportBookmark {
  title: string;
  url: string;
  memo: string | null;
  favicon_url: string | null;
  folder_id: string | null;
  tab_id: string | null;
  sort_order: number;
}

export interface ExportFolder {
  id: string;
  parent_id: string | null;
  title: string;
  sort_order: number;
}

export interface ExportTagGroup {
  id: string;
  title: string;
  color: string | null;
  filter_mode: string;
  sort_order: number;
}

export interface ExportTag {
  id: string;
  tag_group_id: string;
  title: string;
  sort_order: number;
}

export interface ExportBookmarkTag {
  bookmark_id: string;
  tag_id: string;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  tab: { title: string; type: "folders" | "tags" };
  folders: ExportFolder[];
  bookmarks: (ExportBookmark & { id: string })[];
  tagGroups: ExportTagGroup[];
  tags: ExportTag[];
  bookmarkTags: ExportBookmarkTag[];
}

// === Import Types ===

export interface ParsedFolder {
  tempId: string;
  parentTempId: string | null;
  title: string;
  sort_order: number;
}

export interface ParsedBookmark {
  title: string;
  url: string;
  memo: string | null;
  folderTempId: string | null;
  sort_order: number;
}

export interface ParsedTagGroup {
  tempId: string;
  title: string;
  color: string | null;
  filter_mode: string;
  sort_order: number;
}

export interface ParsedTag {
  tempId: string;
  tagGroupTempId: string;
  title: string;
  sort_order: number;
}

export interface ParsedBookmarkTag {
  bookmarkTempId: string;
  tagTempId: string;
}

export interface ParsedImportData {
  source: "html" | "json";
  tabTitle?: string;
  tabType: "folders" | "tags";
  folders: ParsedFolder[];
  bookmarks: (ParsedBookmark & { tempId: string })[];
  tagGroups: ParsedTagGroup[];
  tags: ParsedTag[];
  bookmarkTags: ParsedBookmarkTag[];
}

// === HTML Bookmark Parsing (Netscape format) ===

export function parseHTMLBookmarks(html: string): ParsedImportData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const folders: ParsedFolder[] = [];
  const bookmarks: (ParsedBookmark & { tempId: string })[] = [];
  let idCounter = 0;

  function nextId(): string {
    return `temp_${++idCounter}`;
  }

  function processDL(dl: Element, parentTempId: string | null, sortBase: number) {
    const children = dl.children;
    let sortOrder = sortBase;

    for (let i = 0; i < children.length; i++) {
      const dt = children[i];
      if (dt.tagName !== "DT") continue;

      sortOrder += 1000;

      // Check if this DT contains a folder (H3) or a bookmark (A)
      const h3 = dt.querySelector(":scope > H3");
      const a = dt.querySelector(":scope > A");

      if (h3) {
        // It's a folder
        const folderTempId = nextId();
        folders.push({
          tempId: folderTempId,
          parentTempId,
          title: h3.textContent?.trim() || "Untitled Folder",
          sort_order: sortOrder,
        });

        // Look for nested DL inside this DT
        const nestedDL = dt.querySelector(":scope > DL");
        if (nestedDL) {
          processDL(nestedDL, folderTempId, 0);
        }
      } else if (a) {
        // It's a bookmark
        const url = a.getAttribute("HREF") || a.getAttribute("href") || "";
        if (url) {
          bookmarks.push({
            tempId: nextId(),
            title: a.textContent?.trim() || url,
            url,
            memo: null,
            folderTempId: parentTempId,
            sort_order: sortOrder,
          });
        }
      }
    }
  }

  // Find the root DL element
  const rootDL = doc.querySelector("DL");
  if (rootDL) {
    processDL(rootDL, null, 0);
  }

  return {
    source: "html",
    tabType: "folders",
    folders,
    bookmarks,
    tagGroups: [],
    tags: [],
    bookmarkTags: [],
  };
}

// === JSON Bookmark Parsing ===

export function parseJSONBookmarks(jsonStr: string): ParsedImportData {
  const raw = JSON.parse(jsonStr) as ExportData;

  if (raw.version !== 1) {
    throw new Error(`不支援的匯出版本: ${raw.version}`);
  }

  // Map original IDs to temp IDs
  const folderIdMap = new Map<string, string>();
  const bookmarkIdMap = new Map<string, string>();
  const tagGroupIdMap = new Map<string, string>();
  const tagIdMap = new Map<string, string>();
  let idCounter = 0;
  function nextId(): string {
    return `temp_${++idCounter}`;
  }

  const folders: ParsedFolder[] = raw.folders.map((f) => {
    const tempId = nextId();
    folderIdMap.set(f.id, tempId);
    return {
      tempId,
      parentTempId: null, // will be resolved below
      title: f.title,
      sort_order: f.sort_order,
    };
  });

  // Resolve parent references
  for (const f of folders) {
    const original = raw.folders.find((of_) => folderIdMap.get(of_.id) === f.tempId);
    if (original?.parent_id) {
      f.parentTempId = folderIdMap.get(original.parent_id) || null;
    }
  }

  const bookmarks: (ParsedBookmark & { tempId: string })[] = raw.bookmarks.map((b) => {
    const tempId = nextId();
    bookmarkIdMap.set(b.id, tempId);
    return {
      tempId,
      title: b.title,
      url: b.url,
      memo: b.memo || null,
      folderTempId: b.folder_id ? (folderIdMap.get(b.folder_id) || null) : null,
      sort_order: b.sort_order,
    };
  });

  const tagGroups: ParsedTagGroup[] = raw.tagGroups.map((tg) => {
    const tempId = nextId();
    tagGroupIdMap.set(tg.id, tempId);
    return {
      tempId,
      title: tg.title,
      color: tg.color,
      filter_mode: tg.filter_mode,
      sort_order: tg.sort_order,
    };
  });

  const tags: ParsedTag[] = raw.tags.map((t) => {
    const tempId = nextId();
    tagIdMap.set(t.id, tempId);
    return {
      tempId,
      tagGroupTempId: tagGroupIdMap.get(t.tag_group_id) || t.tag_group_id,
      title: t.title,
      sort_order: t.sort_order,
    };
  });

  const bookmarkTags: ParsedBookmarkTag[] = raw.bookmarkTags.map((bt) => ({
    bookmarkTempId: bookmarkIdMap.get(bt.bookmark_id) || bt.bookmark_id,
    tagTempId: tagIdMap.get(bt.tag_id) || bt.tag_id,
  }));

  return {
    source: "json",
    tabTitle: raw.tab.title,
    tabType: raw.tab.type,
    folders,
    bookmarks,
    tagGroups,
    tags,
    bookmarkTags,
  };
}

// === Export ===

function flattenFolders(folders: FolderWithChildren[]): ExportFolder[] {
  const result: ExportFolder[] = [];
  function walk(nodes: FolderWithChildren[]) {
    for (const f of nodes) {
      result.push({
        id: f.id,
        parent_id: f.parent_id,
        title: f.title,
        sort_order: f.sort_order,
      });
      if (f.children) walk(f.children);
    }
  }
  walk(folders);
  return result;
}

function flattenBookmarks(folders: FolderWithChildren[]): (ExportBookmark & { id: string })[] {
  const result: (ExportBookmark & { id: string })[] = [];
  function walk(nodes: FolderWithChildren[]) {
    for (const f of nodes) {
      if (f.bookmarks) {
        for (const b of f.bookmarks) {
          result.push({
            id: b.id,
            title: b.title,
            url: b.url,
            memo: b.memo,
            favicon_url: b.favicon_url,
            folder_id: b.folder_id,
            tab_id: b.tab_id,
            sort_order: b.sort_order,
          });
        }
      }
      if (f.children) walk(f.children);
    }
  }
  walk(folders);
  return result;
}

export function exportTabToJSON(tab: TabData): void {
  let exportData: ExportData;

  if (isFoldersTab(tab)) {
    const foldersTab = tab as TabWithFolders;
    exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tab: { title: tab.title, type: "folders" },
      folders: flattenFolders(foldersTab.folders),
      bookmarks: flattenBookmarks(foldersTab.folders),
      tagGroups: [],
      tags: [],
      bookmarkTags: [],
    };
  } else {
    const tagsTab = tab as TabWithTags;
    const allTags: ExportTag[] = [];
    const allTagGroups: ExportTagGroup[] = [];

    for (const tg of tagsTab.tagGroups) {
      allTagGroups.push({
        id: tg.id,
        title: tg.title,
        color: tg.color,
        filter_mode: tg.filter_mode,
        sort_order: tg.sort_order,
      });
      for (const t of tg.tags) {
        allTags.push({
          id: t.id,
          tag_group_id: t.tag_group_id,
          title: t.title,
          sort_order: t.sort_order,
        });
      }
    }

    const bookmarkTags: ExportBookmarkTag[] = [];
    for (const b of tagsTab.bookmarks) {
      for (const t of b.tags) {
        bookmarkTags.push({ bookmark_id: b.id, tag_id: t.id });
      }
    }

    exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tab: { title: tab.title, type: "tags" },
      folders: [],
      bookmarks: tagsTab.bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        memo: b.memo,
        favicon_url: b.favicon_url,
        folder_id: b.folder_id,
        tab_id: b.tab_id,
        sort_order: b.sort_order,
      })),
      tagGroups: allTagGroups,
      tags: allTags,
      bookmarkTags,
    };
  }

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${tab.title}-bookmarks.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
