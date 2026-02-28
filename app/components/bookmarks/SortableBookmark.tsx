import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, DotsThreeVertical, PencilSimple, FolderOpen, Trash, Tag as TagIcon, ArrowSquareOut, BookmarkSimple as BookmarkIcon, Copy } from "@phosphor-icons/react";
import type { Bookmark, Tag } from "~/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";

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
        transform,
        transition,
        isDragging,
    } = useSortable({ id: bookmark.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    style={style}
                    className="group relative bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all"
                >
                    <button
                        {...attributes}
                        {...listeners}
                        className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <DotsSixVertical className="w-3 h-3" />
                    </button>
                    <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
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
                                <h4 className="font-medium truncate group-hover:text-primary transition-colors">
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
                    </a>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.preventDefault()}
                                    className="p-1 rounded hover:bg-secondary/90"
                                >
                                    <DotsThreeVertical className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(bookmark.id)}>
                                    <PencilSimple className="w-4 h-4" />
                                    編輯
                                </DropdownMenuItem>
                                {onMove && (
                                    <DropdownMenuItem onClick={() => onMove(bookmark.id)}>
                                        <FolderOpen className="w-4 h-4" />
                                        移動到資料夾
                                    </DropdownMenuItem>
                                )}
                                {onManageTags && (
                                    <DropdownMenuItem onClick={() => onManageTags(bookmark.id)}>
                                        <TagIcon className="w-4 h-4" />
                                        管理標籤
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onDelete(bookmark.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash className="w-4 h-4" />
                                    刪除
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => window.open(bookmark.url, "_blank", "noopener,noreferrer")}>
                    <ArrowSquareOut className="w-4 h-4" />
                    在新分頁開啟
                </ContextMenuItem>
                <ContextMenuItem onClick={() => navigator.clipboard.writeText(bookmark.url)}>
                    <Copy className="w-4 h-4" />
                    複製網址
                </ContextMenuItem>
                <ContextMenuSeparator />
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
