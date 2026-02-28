import { data, type ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { tabs, folders, bookmarks, workspaces, tagGroups, tags, bookmarkTags } from "~/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { bumpUserDataHash } from "~/lib/hash.server";
import { getFaviconUrl } from "~/lib/utils";
import type { ParsedImportData } from "~/lib/bookmark-io";

interface ImportRequest {
  target: { type: "new"; title: string; workspaceId: string } | { type: "existing"; tabId: string };
  data: ParsedImportData;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await requireAuth(request, context.cloudflare.env);
  const db = createDb(context.cloudflare.env);

  try {
    const body = (await request.json()) as ImportRequest;
    const { target, data: importData } = body;

    let tabId: string;

    if (target.type === "new") {
      // Validate workspace ownership
      const workspace = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(and(eq(workspaces.id, target.workspaceId), eq(workspaces.user_id, user.id)))
        .get();

      if (!workspace) {
        return data({ error: "找不到該工作區" }, { status: 404 });
      }

      // Get max sort_order for new tab
      const existingTabs = await db
        .select({ sort_order: tabs.sort_order })
        .from(tabs)
        .where(and(eq(tabs.user_id, user.id), eq(tabs.workspace_id, target.workspaceId)))
        .orderBy(desc(tabs.sort_order))
        .limit(1)
        .all();

      const newTabSortOrder = existingTabs.length > 0
        ? (existingTabs[0].sort_order || 0) + 1000
        : 1000;

      const newTab = await db
        .insert(tabs)
        .values({
          user_id: user.id,
          workspace_id: target.workspaceId,
          title: target.title.trim(),
          type: importData.tabType,
          sort_order: newTabSortOrder,
        })
        .returning()
        .get();

      tabId = newTab.id;
    } else {
      // Validate tab ownership
      const existingTab = await db
        .select({ id: tabs.id })
        .from(tabs)
        .where(and(eq(tabs.id, target.tabId), eq(tabs.user_id, user.id)))
        .get();

      if (!existingTab) {
        return data({ error: "找不到該 Tab" }, { status: 404 });
      }

      tabId = target.tabId;
    }

    // Map temp IDs to real IDs
    const folderIdMap = new Map<string, string>();
    const bookmarkIdMap = new Map<string, string>();
    const tagGroupIdMap = new Map<string, string>();
    const tagIdMap = new Map<string, string>();

    // Create folders (need to handle parent references, so do in order)
    // Sort folders so parents come before children
    const sortedFolders = sortFoldersParentFirst(importData.folders);

    if (sortedFolders.length > 0) {
      // D1 batch has a limit, process in chunks
      const BATCH_SIZE = 40;
      for (let i = 0; i < sortedFolders.length; i += BATCH_SIZE) {
        const chunk = sortedFolders.slice(i, i + BATCH_SIZE);
        const folderStatements = chunk.map((f) => {
          const newId = crypto.randomUUID();
          folderIdMap.set(f.tempId, newId);
          const parentId = f.parentTempId ? (folderIdMap.get(f.parentTempId) || null) : null;
          return db.insert(folders).values({
            id: newId,
            user_id: user.id,
            tab_id: tabId,
            parent_id: parentId,
            title: f.title,
            sort_order: f.sort_order,
          });
        });
        await db.batch(folderStatements as any);
      }
    }

    // Create bookmarks
    if (importData.bookmarks.length > 0) {
      const BATCH_SIZE = 40;
      for (let i = 0; i < importData.bookmarks.length; i += BATCH_SIZE) {
        const chunk = importData.bookmarks.slice(i, i + BATCH_SIZE);
        const bookmarkStatements = chunk.map((b) => {
          const newId = crypto.randomUUID();
          bookmarkIdMap.set(b.tempId, newId);
          const folderId = b.folderTempId ? (folderIdMap.get(b.folderTempId) || null) : null;

          return db.insert(bookmarks).values({
            id: newId,
            user_id: user.id,
            folder_id: folderId,
            tab_id: folderId ? null : tabId,
            title: b.title,
            url: b.url,
            favicon_url: getFaviconUrl(b.url),
            memo: b.memo,
            sort_order: b.sort_order,
          });
        });
        await db.batch(bookmarkStatements as any);
      }
    }

    // Create tag groups
    if (importData.tagGroups.length > 0) {
      const tagGroupStatements = importData.tagGroups.map((tg) => {
        const newId = crypto.randomUUID();
        tagGroupIdMap.set(tg.tempId, newId);
        return db.insert(tagGroups).values({
          id: newId,
          user_id: user.id,
          tab_id: tabId,
          title: tg.title,
          color: tg.color,
          filter_mode: tg.filter_mode,
          sort_order: tg.sort_order,
        });
      });
      await db.batch(tagGroupStatements as any);
    }

    // Create tags
    if (importData.tags.length > 0) {
      const tagStatements = importData.tags.map((t) => {
        const newId = crypto.randomUUID();
        tagIdMap.set(t.tempId, newId);
        const tagGroupId = tagGroupIdMap.get(t.tagGroupTempId);
        if (!tagGroupId) return null;
        return db.insert(tags).values({
          id: newId,
          user_id: user.id,
          tag_group_id: tagGroupId,
          title: t.title,
          sort_order: t.sort_order,
        });
      }).filter(Boolean);
      if (tagStatements.length > 0) {
        await db.batch(tagStatements as any);
      }
    }

    // Create bookmark-tag associations
    if (importData.bookmarkTags.length > 0) {
      const btStatements = importData.bookmarkTags.map((bt) => {
        const bookmarkId = bookmarkIdMap.get(bt.bookmarkTempId);
        const tagId = tagIdMap.get(bt.tagTempId);
        if (!bookmarkId || !tagId) return null;
        return db.insert(bookmarkTags).values({
          bookmark_id: bookmarkId,
          tag_id: tagId,
        });
      }).filter(Boolean);
      if (btStatements.length > 0) {
        const BATCH_SIZE = 40;
        for (let i = 0; i < btStatements.length; i += BATCH_SIZE) {
          const chunk = btStatements.slice(i, i + BATCH_SIZE);
          await db.batch(chunk as any);
        }
      }
    }

    await bumpUserDataHash(db, user.id);

    return { success: true, tabId };
  } catch (error) {
    console.error("Import error:", error);
    return data(
      { error: error instanceof Error ? error.message : "匯入失敗" },
      { status: 500 }
    );
  }
}

// Sort folders so that parents always come before their children
function sortFoldersParentFirst(folders: ParsedImportData["folders"]) {
  const result: typeof folders = [];
  const added = new Set<string>();
  const byParent = new Map<string | null, typeof folders>();

  for (const f of folders) {
    const key = f.parentTempId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(f);
  }

  function addChildren(parentId: string | null) {
    const children = byParent.get(parentId) || [];
    for (const child of children) {
      if (!added.has(child.tempId)) {
        result.push(child);
        added.add(child.tempId);
        addChildren(child.tempId);
      }
    }
  }

  addChildren(null);

  // Add any remaining folders (orphans)
  for (const f of folders) {
    if (!added.has(f.tempId)) {
      result.push(f);
      added.add(f.tempId);
    }
  }

  return result;
}
