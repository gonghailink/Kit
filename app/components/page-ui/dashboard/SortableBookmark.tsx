import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Edit, FolderOpen, Trash2 } from "lucide-react";
import type { Bookmark } from "~/lib/types";
import { getHostname } from "~/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface SortableBookmarkProps {
    bookmark: Bookmark;
    onEdit: () => void;
    onDelete: () => void;
    onMove: () => void;
}

export function SortableBookmark({
    bookmark,
    onEdit,
    onDelete,
    onMove,
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
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
                        <img
                            src={bookmark.favicon_url || "/default-favicon.svg"}
                            alt=""
                            className="w-5 h-5 flex-shrink-0 rounded-sm"
                            onError={(e) => {
                                e.currentTarget.src = "/default-favicon.svg";
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate group-hover:text-primary">
                            {bookmark.title}
                        </h4>
                        {bookmark.memo && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {bookmark.memo}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground/80 truncate mt-1">
                            {getHostname(bookmark.url)}
                        </p>
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
                        <DropdownMenuItem onClick={onMove}>
                            <FolderOpen className="w-4 h-4" />
                            移動到資料夾
                        </DropdownMenuItem>
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
