import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { PencilSimple, FolderOpen, Trash, Tag as TagIcon, BookmarkSimple as BookmarkIcon } from "@phosphor-icons/react";
import type { Bookmark, Tag } from "~/lib/types";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { bookmarkCardSurfaceClass } from "~/components/bookmarks/cardStyles";

interface SortableBookmarkProps {
    bookmark: Bookmark;
    tags?: Tag[];
    tagColorMap?: Record<string, string | null>;
    onEdit: (bookmarkId: string) => void;
    onDelete: (bookmarkId: string) => void;
    onMove?: (bookmarkId: string) => void;
    onManageTags?: (bookmarkId: string) => void;
}

export const SortableBookmark = memo(function SortableBookmark({
    bookmark,
    tags,
    tagColorMap,
    onEdit,
    onDelete,
    onMove,
    onManageTags,
}: SortableBookmarkProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging,
        isSorting,
        activeIndex,
        overIndex,
        index,
    } = useSortable({ id: bookmark.id });

    // Show drop indicator bar instead of shifting items during drag
    const isDropTarget = isSorting && !isDragging && index === overIndex;
    const showIndicatorBefore = isDropTarget && activeIndex > overIndex;
    const showIndicatorAfter = isDropTarget && activeIndex < overIndex;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    {...attributes}
                    {...listeners}
                    onClick={() => onEdit(bookmark.id)}
                    className={`${bookmarkCardSurfaceClass} cursor-pointer active:cursor-grabbing select-none [-webkit-touch-callout:none] ${isDragging ? "opacity-30" : ""}`}
                >
                    {showIndicatorBefore && (
                        <div className="absolute -left-[10px] top-1 bottom-1 w-[3px] bg-primary rounded-full z-10" />
                    )}
                    {showIndicatorAfter && (
                        <div className="absolute -right-[10px] top-1 bottom-1 w-[3px] bg-primary rounded-full z-10" />
                    )}
                    <div className="flex items-start gap-3">
                        {bookmark.favicon_url ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
                                <img
                                    src={bookmark.favicon_url}
                                    alt=""
                                    className="w-5 h-5 flex-shrink-0 rounded-sm"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            </div>
                        ) : (
                            <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                                {bookmark.title}
                            </h4>
                            {bookmark.memo && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {bookmark.memo}
                                </p>
                            )}
                            {/* Tag Badges */}
                            {tags && tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {tags.map((tag) => {
                                        const color = tagColorMap?.[tag.tag_group_id] || null;
                                        return (
                                            <span
                                                key={tag.id}
                                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                                style={{
                                                    backgroundColor: color ? `${color}20` : "hsl(var(--secondary))",
                                                    color: color || "hsl(var(--muted-foreground))",
                                                }}
                                            >
                                                {tag.title}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => onEdit(bookmark.id)}>
                    <PencilSimple className="w-4 h-4" />
                    編輯
                </ContextMenuItem>
                {onMove && (
                    <ContextMenuItem onClick={() => onMove(bookmark.id)}>
                        <FolderOpen className="w-4 h-4" />
                        移動到資料夾
                    </ContextMenuItem>
                )}
                {onManageTags && (
                    <ContextMenuItem onClick={() => onManageTags(bookmark.id)}>
                        <TagIcon className="w-4 h-4" />
                        管理標籤
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={() => onDelete(bookmark.id)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash className="w-4 h-4" />
                    刪除
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.bookmark.id === nextProps.bookmark.id &&
        prevProps.bookmark.title === nextProps.bookmark.title &&
        prevProps.bookmark.url === nextProps.bookmark.url &&
        prevProps.bookmark.favicon_url === nextProps.bookmark.favicon_url &&
        prevProps.bookmark.memo === nextProps.bookmark.memo &&
        prevProps.bookmark.sort_order === nextProps.bookmark.sort_order &&
        prevProps.tags === nextProps.tags &&
        prevProps.tagColorMap === nextProps.tagColorMap &&
        prevProps.onEdit === nextProps.onEdit &&
        prevProps.onDelete === nextProps.onDelete &&
        prevProps.onMove === nextProps.onMove &&
        prevProps.onManageTags === nextProps.onManageTags
    );
});
