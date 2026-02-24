import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Edit, FolderOpen, Trash2, TagIcon, ExternalLink, Bookmark as BookmarkIcon } from "lucide-react";
import type { Bookmark, Tag } from "~/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface SortableBookmarkProps {
    bookmark: Bookmark;
    tags?: Tag[];
    tagColorMap?: Record<string, string | null>;
    onEdit: () => void;
    onDelete: () => void;
    onMove?: () => void;
    onManageTags?: () => void;
}

export function SortableBookmark({
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
        <div
            ref={setNodeRef}
            style={style}
            className="group relative bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all group"
        >
            <button
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-3 h-3" />
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
                            <MoreVertical className="w-3 h-3 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="w-4 h-4" />
                            編輯
                        </DropdownMenuItem>
                        {onMove && (
                            <DropdownMenuItem onClick={onMove}>
                                <FolderOpen className="w-4 h-4" />
                                移動到資料夾
                            </DropdownMenuItem>
                        )}
                        {onManageTags && (
                            <DropdownMenuItem onClick={onManageTags}>
                                <TagIcon className="w-4 h-4" />
                                管理標籤
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                            刪除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
