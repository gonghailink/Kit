import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Edit, Trash2 } from "lucide-react";
import type { Tab } from "~/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface SortableTabItemProps {
    tab: Tab;
    isActive: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function SortableTabItem({
    tab,
    isActive,
    onSelect,
    onEdit,
    onDelete,
}: SortableTabItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group flex items-center relative">
            <button
                {...attributes}
                {...listeners}
                className="absolute -left-3 z-10 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded"
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <button
                onClick={onSelect}
                className={`
          px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
          ${isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }
        `}
            >
                {tab.title}
            </button>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-secondary/60 rounded">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="w-4 h-4" />
                            編輯
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
