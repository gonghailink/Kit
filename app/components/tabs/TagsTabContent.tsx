import { useState, useMemo, useCallback, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBookmark } from "~/components/bookmarks/SortableBookmark";
import { BookmarkCard } from "~/components/bookmarks/BookmarkCard";
import type { TabWithTags, Tag, BookmarkWithTags } from "~/lib/types";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { TagFilterBar } from "~/components/tags/TagFilterBar";
import { groupBookmarksByTagGroup, type BookmarkGroup } from "~/lib/utils";

interface TagsTabContentProps {
  tab: TabWithTags;
  onCreateBookmark: () => void;
  onEditBookmark: (bookmarkId: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export function TagsTabContent({
  tab,
  onCreateBookmark,
  onEditBookmark,
  onDeleteBookmark,
}: TagsTabContentProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const reorderFetcher = useFetcher();
  const groupFetcher = useFetcher();
  const revalidator = useRevalidator();

  // 本地書籤狀態（用於 optimistic update，拖動結束後立即更新順序）
  const [localBookmarks, setLocalBookmarks] = useState(tab.bookmarks);
  useEffect(() => {
    setLocalBookmarks(tab.bookmarks);
  }, [tab.bookmarks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 找出 group 模式的 TagGroup
  const groupTagGroup = useMemo(() => {
    return tab.tagGroups.find(tg => tg.filter_mode === "group") || null;
  }, [tab.tagGroups]);

  // group TagGroup 的 tag IDs（用於過濾 badges）
  const groupTagIds = useMemo(() => {
    if (!groupTagGroup) return null;
    return new Set(groupTagGroup.tags.map(t => t.id));
  }, [groupTagGroup]);

  // TagGroup id -> color 映射
  const tagColorMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const tg of tab.tagGroups) {
      map[tg.id] = tg.color;
    }
    return map;
  }, [tab.tagGroups]);

  // TagGroup id -> 排序索引（用於 tag badges 依 TagGroup 順序排列）
  const tagGroupOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    tab.tagGroups.forEach((tg, index) => {
      map[tg.id] = index;
    });
    return map;
  }, [tab.tagGroups]);

  // 篩選後的書籤：各 group 內依 filter_mode (and/or)，group 之間為 AND
  // 排除 group 模式的 TagGroup（不參與篩選計算）
  const filteredBookmarks = useMemo(() => {
    if (selectedTagIds.size === 0) return localBookmarks;

    // 按 tagGroup 分組已選取的 tagIds，排除 group 模式
    const groupSelections = tab.tagGroups
      .filter(group => group.filter_mode !== "group")
      .map((group) => ({
        filterMode: group.filter_mode,
        tagIds: group.tags.map((t) => t.id).filter((id) => selectedTagIds.has(id)),
      }))
      .filter((g) => g.tagIds.length > 0);

    return localBookmarks.filter((b) => {
      const bookmarkTagIds = new Set(b.tags.map((t) => t.id));
      return groupSelections.every((group) => {
        if (group.filterMode === "and") {
          return group.tagIds.every((id) => bookmarkTagIds.has(id));
        }
        return group.tagIds.some((id) => bookmarkTagIds.has(id));
      });
    });
  }, [localBookmarks, tab.tagGroups, selectedTagIds]);

  // 分組後的書籤
  const groupedBookmarks = useMemo(() => {
    if (!groupTagGroup) return null;
    return groupBookmarksByTagGroup(filteredBookmarks, groupTagGroup);
  }, [groupTagGroup, filteredBookmarks]);

  // 預計算每個書籤排序後的 tags（穩定引用，避免每次 render 建新陣列）
  // 如果有 group 模式，過濾掉 group TagGroup 的 tags
  const sortedTagsMap = useMemo(() => {
    const map: Record<string, Tag[]> = {};
    const bookmarksToProcess = groupedBookmarks
      ? groupedBookmarks.flatMap(g => g.bookmarks)
      : filteredBookmarks;

    for (const bookmark of bookmarksToProcess) {
      if (map[bookmark.id]) continue;
      let tags = [...bookmark.tags].sort((a, b) => {
        const groupDiff = (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999);
        if (groupDiff !== 0) return groupDiff;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      // 在分組模式下，隱藏 group TagGroup 的 tags
      if (groupTagIds) {
        tags = tags.filter(t => !groupTagIds.has(t.id));
      }
      map[bookmark.id] = tags;
    }
    return map;
  }, [filteredBookmarks, groupedBookmarks, tagGroupOrderMap, groupTagIds]);

  // Memoize SortableContext items 陣列
  const sortableBookmarkIds = useMemo(
    () => filteredBookmarks.map((b) => b.id),
    [filteredBookmarks]
  );

  // 找出 tagId 所屬的 tagGroup
  const findTagGroup = (tagId: string) => {
    return tab.tagGroups.find((g) => g.tags.some((t) => t.id === tagId));
  };

  const toggleTag = (tagId: string) => {
    const group = findTagGroup(tagId);
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        // single 模式：先清除同 group 內的其他選取
        if (group?.filter_mode === "single") {
          for (const t of group.tags) {
            next.delete(t.id);
          }
        }
        next.add(tagId);
      }
      return next;
    });
  };

  // 清除特定 TagGroup 的所有篩選
  const clearGroupFilters = (tagGroup: TabWithTags["tagGroups"][number]) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      for (const tag of tagGroup.tags) {
        next.delete(tag.id);
      }
      return next;
    });
  };

  // 檢查某 TagGroup 是否有任何已選取的 tag
  const hasGroupSelection = (tagGroup: TabWithTags["tagGroups"][number]) => {
    return tagGroup.tags.some((tag) => selectedTagIds.has(tag.id));
  };

  const clearFilters = () => {
    setSelectedTagIds(new Set());
  };

  // 切換分組 TagGroup
  const handleChangeGroupTagGroup = useCallback((tagGroupId: string | null) => {
    // 如果目前有 group，先將它改回 "or"
    if (groupTagGroup && groupTagGroup.id !== tagGroupId) {
      groupFetcher.submit(
        { intent: "update", id: groupTagGroup.id, filter_mode: "or" },
        { method: "post", action: "/api/tag-groups" }
      );
    }
    // 設定新的 group（API 會自動清除舊的，但上面已手動處理）
    if (tagGroupId) {
      groupFetcher.submit(
        { intent: "update", id: tagGroupId, filter_mode: "group" },
        { method: "post", action: "/api/tag-groups" }
      );
    }
    revalidator.revalidate();
  }, [groupTagGroup, groupFetcher, revalidator]);

  // DragOverlay 狀態
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const activeDragBookmark = activeDragId
    ? filteredBookmarks.find((b) => b.id === activeDragId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleBookmarkDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = filteredBookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newFiltered = arrayMove(filteredBookmarks, oldIndex, newIndex);

      // Optimistic update：立即更新本地書籤順序
      if (selectedTagIds.size === 0) {
        // 未篩選時，filteredBookmarks === localBookmarks，直接用 newFiltered
        setLocalBookmarks(newFiltered);
      } else {
        // 有篩選時，需要把 newFiltered 的順序映射回完整的 localBookmarks
        const orderMap = new Map(newFiltered.map((b, i) => [b.id, i]));
        setLocalBookmarks((prev) =>
          [...prev].sort((a, b) => {
            const aIdx = orderMap.get(a.id);
            const bIdx = orderMap.get(b.id);
            if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
            if (aIdx !== undefined) return -1;
            if (bIdx !== undefined) return 1;
            return 0;
          })
        );
      }

      const ids = newFiltered.map((b) => b.id);
      const sortOrders = newFiltered.map((_, index) => (index + 1) * 1000);

      reorderFetcher.submit(
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
    }
  }, [filteredBookmarks, selectedTagIds, reorderFetcher]);

  // 分組模式下：組內書籤重新排序
  const handleGroupBookmarkReorder = useCallback((reorderedBookmarks: BookmarkWithTags[]) => {
    // Optimistic update：僅調整該組內書籤的相對順序
    const orderMap = new Map(reorderedBookmarks.map((b, i) => [b.id, i]));
    setLocalBookmarks((prev) =>
      [...prev].sort((a, b) => {
        const aIdx = orderMap.get(a.id);
        const bIdx = orderMap.get(b.id);
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        return 0;
      })
    );

    const ids = reorderedBookmarks.map((b) => b.id);
    const sortOrders = reorderedBookmarks.map((_, index) => (index + 1) * 1000);
    reorderFetcher.submit(
      {
        intent: "reorder",
        ids: JSON.stringify(ids),
        sortOrders: JSON.stringify(sortOrders),
      },
      { method: "post", action: "/api/bookmarks" }
    );
  }, [reorderFetcher]);

  return (
    <div className="max-w-7xl mx-auto">
      <TagFilterBar
        tagGroups={tab.tagGroups}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        onClearGroupFilters={clearGroupFilters}
        onClearAllFilters={clearFilters}
        hasGroupSelection={hasGroupSelection}
        showGroupControl
        groupTagGroupId={groupTagGroup?.id || null}
        onChangeGroupTagGroup={handleChangeGroupTagGroup}
      />

      {/* Bookmarks */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {tab.bookmarks.length === 0
              ? "此 Tab 尚無書籤"
              : "沒有符合篩選條件的書籤"}
          </p>
          {tab.bookmarks.length === 0 && (
            <button
              onClick={onCreateBookmark}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
            >
              新增書籤
            </button>
          )}
        </div>
      ) : groupedBookmarks ? (
        /* 分組顯示：每組各自有獨立的 DndContext，支援組內拖曳排序 */
        <div className="grid grid-cols-1 gap-8 pb-16">
          {groupedBookmarks.map((group) => (
            <SortableGroupSection
              key={group.tag?.id || "uncategorized"}
              group={group}
              sensors={sensors}
              sortedTagsMap={sortedTagsMap}
              tagColorMap={tagColorMap}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
              onReorder={handleGroupBookmarkReorder}
            />
          ))}
        </div>
      ) : (
        /* 平面顯示（原有邏輯） */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleBookmarkDragEnd}
        >
          <SortableContext
            items={sortableBookmarkIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
              {filteredBookmarks.map((bookmark) => (
                <SortableBookmark
                  key={bookmark.id}
                  bookmark={bookmark}
                  tags={sortedTagsMap[bookmark.id]}
                  tagColorMap={tagColorMap}
                  onEdit={onEditBookmark}
                  onDelete={onDeleteBookmark}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragBookmark ? (
              <BookmarkCard
                bookmark={activeDragBookmark}
                tags={sortedTagsMap[activeDragBookmark.id]}
                tagColorMap={tagColorMap}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

/** 分組模式下的單一組別，包含獨立的 DndContext 支援組內拖曳排序 */
function SortableGroupSection({
  group,
  sensors,
  sortedTagsMap,
  tagColorMap,
  onEdit,
  onDelete,
  onReorder,
}: {
  group: BookmarkGroup;
  sensors: SensorDescriptor<SensorOptions>[];
  sortedTagsMap: Record<string, Tag[]>;
  tagColorMap: Record<string, string | null>;
  onEdit: (bookmarkId: string) => void;
  onDelete: (bookmarkId: string) => void;
  onReorder: (bookmarks: BookmarkWithTags[]) => void;
}) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const activeDragBookmark = activeDragId
    ? group.bookmarks.find((b) => b.id === activeDragId)
    : null;

  const sortableIds = useMemo(
    () => group.bookmarks.map((b) => b.id),
    [group.bookmarks]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = group.bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = group.bookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(group.bookmarks, oldIndex, newIndex));
    }
  }, [group.bookmarks, onReorder]);

  return (
    <div className="rounded-xl p-6 bg-transparent">
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: group.color || undefined }}
      >
        {group.label}
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.bookmarks.map((bookmark) => (
              <SortableBookmark
                key={bookmark.id}
                bookmark={bookmark}
                tags={sortedTagsMap[bookmark.id]}
                tagColorMap={tagColorMap}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragBookmark ? (
            <BookmarkCard
              bookmark={activeDragBookmark}
              tags={sortedTagsMap[activeDragBookmark.id]}
              tagColorMap={tagColorMap}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
