import { useState, useMemo, useCallback, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
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
import { SortableBookmark } from "./SortableBookmark";
import { BookmarkCard } from "./BookmarkCard";
import type { TabWithTags } from "~/lib/types";
import { TagFilterBar } from "~/components/page-ui/shared/TagFilterBar";

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
  const filteredBookmarks = useMemo(() => {
    if (selectedTagIds.size === 0) return localBookmarks;

    // 按 tagGroup 分組已選取的 tagIds
    const groupSelections = tab.tagGroups
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

  // 預計算每個書籤排序後的 tags（穩定引用，避免每次 render 建新陣列）
  const sortedTagsMap = useMemo(() => {
    const map: Record<string, typeof filteredBookmarks[0]["tags"]> = {};
    for (const bookmark of filteredBookmarks) {
      map[bookmark.id] = [...bookmark.tags].sort(
        (a, b) => (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999)
      );
    }
    return map;
  }, [filteredBookmarks, tagGroupOrderMap]);

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

  return (
    <div className="max-w-7xl min-h-[80vh] mx-auto">
      <TagFilterBar
        tagGroups={tab.tagGroups}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        onClearGroupFilters={clearGroupFilters}
        onClearAllFilters={clearFilters}
        hasGroupSelection={hasGroupSelection}
      />

      {/* Bookmarks Grid */}
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
      ) : (
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
