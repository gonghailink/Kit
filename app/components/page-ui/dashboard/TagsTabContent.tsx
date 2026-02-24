import { useState, useMemo } from "react";
import { useFetcher } from "@remix-run/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBookmark } from "./SortableBookmark";
import type { TabWithTags, Bookmark } from "~/lib/types";

interface TagsTabContentProps {
  tab: TabWithTags;
  onCreateBookmark: () => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
}

export function TagsTabContent({
  tab,
  onCreateBookmark,
  onEditBookmark,
  onDeleteBookmark,
}: TagsTabContentProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const reorderFetcher = useFetcher();

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
    if (selectedTagIds.size === 0) return tab.bookmarks;

    // 按 tagGroup 分組已選取的 tagIds
    const groupSelections = tab.tagGroups
      .map((group) => ({
        filterMode: group.filter_mode,
        tagIds: group.tags.map((t) => t.id).filter((id) => selectedTagIds.has(id)),
      }))
      .filter((g) => g.tagIds.length > 0);

    return tab.bookmarks.filter((b) => {
      const bookmarkTagIds = new Set(b.tags.map((t) => t.id));
      return groupSelections.every((group) => {
        if (group.filterMode === "and") {
          return group.tagIds.every((id) => bookmarkTagIds.has(id));
        }
        return group.tagIds.some((id) => bookmarkTagIds.has(id));
      });
    });
  }, [tab.bookmarks, tab.tagGroups, selectedTagIds]);

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

  const handleBookmarkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = filteredBookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newBookmarks = arrayMove(filteredBookmarks, oldIndex, newIndex);
      const ids = newBookmarks.map((b) => b.id);
      const sortOrders = newBookmarks.map((_, index) => (index + 1) * 1000);

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
  };

  return (
    <div className="max-w-7xl min-h-[80vh] mx-auto">
      {/* Tag Filter Bar */}
      {tab.tagGroups.length > 0 && (
        <div className="mb-6 bg-card/85 rounded-lg border-none p-4 space-y-3">
          {tab.tagGroups.map((tagGroup) => {
            const groupColor = tagGroup.color;
            return (
              <div key={tagGroup.id} className="space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  {tagGroup.title}
                  <span className="text-[10px] font-bold uppercase opacity-50">
                    {tagGroup.filter_mode === "and" ? "AND" : tagGroup.filter_mode === "single" ? "單選" : "OR"}
                  </span>
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => clearGroupFilters(tagGroup)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: !hasGroupSelection(tagGroup)
                        ? (groupColor || "hsl(var(--foreground))")
                        : (groupColor ? `${groupColor}20` : "hsl(var(--secondary))"),
                      color: !hasGroupSelection(tagGroup)
                        ? "white"
                        : (groupColor || "hsl(var(--foreground))"),
                      opacity: !hasGroupSelection(tagGroup) ? 1 : 0.7,
                    }}
                  >
                    全部
                  </button>
                  {tagGroup.tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-100"
                      style={{
                        backgroundColor: selectedTagIds.has(tag.id)
                          ? (groupColor || "hsl(var(--foreground))")
                          : (groupColor ? `${groupColor}20` : "hsl(var(--secondary))"),
                        color: selectedTagIds.has(tag.id)
                          ? "white"
                          : (groupColor || "hsl(var(--foreground))"),
                        opacity: selectedTagIds.has(tag.id) ? 1 : 0.7,
                      }}
                    >
                      {tag.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {selectedTagIds.size > 0 && (
            <button
              onClick={clearFilters}
              className="pl-2 pr-2.5 pt-1 pb-1.5 text-primary hover:bg-primary/10 rounded-full text-sm italic underline underline-offset-4"
            >
              清除篩選
            </button>
          )}
        </div>
      )}

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
          onDragEnd={handleBookmarkDragEnd}
        >
          <SortableContext
            items={filteredBookmarks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
              {filteredBookmarks.map((bookmark) => (
                <SortableBookmark
                  key={bookmark.id}
                  bookmark={bookmark}
                  tags={[...bookmark.tags].sort((a, b) => (tagGroupOrderMap[a.tag_group_id] ?? 999) - (tagGroupOrderMap[b.tag_group_id] ?? 999))}
                  tagColorMap={tagColorMap}
                  onEdit={() => onEditBookmark(bookmark)}
                  onDelete={() => onDeleteBookmark(bookmark)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
