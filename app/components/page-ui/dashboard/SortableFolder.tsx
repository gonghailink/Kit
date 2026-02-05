import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, MoreVertical, Edit, Trash2, CornerDownRightIcon } from "lucide-react";
import type { FolderWithChildren } from "~/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface SortableFolderProps {
    folder: FolderWithChildren;
    isNested?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onCreateSubfolder: () => void;
    onCreateBookmark: () => void;
    children: React.ReactNode;
}

export function SortableFolder({
    folder,
    isNested = false,
    onEdit,
    onDelete,
    onCreateSubfolder,
    onCreateBookmark,
    children,
}: SortableFolderProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: folder.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="px-6 py-4 bg-card/85 rounded-xl">
            <div className="group flex items-center justify-between mb-4 -ml-7">
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                    <h2 className={`flex items-center gap-2 ${isNested ? 'text-md font-medium text-muted-foreground' : 'text-lg font-semibold text-foreground'}`}>
                        {
                            isNested && <CornerDownRightIcon className="w-4 h-4" />
                        }
                        {folder.title}
                    </h2>
                </div>
                <div className="flex items-center gap-3 pr-2">
                    {!isNested && (
                        <button
                            onClick={onCreateBookmark}
                            className="text-muted-foreground hover:text-foreground"
                            title="新增書籤"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground">
                                <MoreVertical className={`${isNested ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onCreateSubfolder}>
                                <Plus className="w-4 h-4" />
                                新增子資料夾
                            </DropdownMenuItem>
                            {isNested && (
                                <DropdownMenuItem onClick={onCreateBookmark}>
                                    <Plus className="w-4 h-4" />
                                    新增書籤
                                </DropdownMenuItem>
                            )}
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
            {children}
        </div>
    );
}
