import { Plus, DotsThreeVertical, PencilSimple, Trash, ArrowBendDownRight, ArrowsDownUp } from "@phosphor-icons/react";
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
    onOrganizeSubfolders?: () => void;
    children: React.ReactNode;
}

export function SortableFolder({
    folder,
    isNested = false,
    onEdit,
    onDelete,
    onCreateSubfolder,
    onCreateBookmark,
    onOrganizeSubfolders,
    children,
}: SortableFolderProps) {
    const hasSubfolders = folder.children && folder.children.length > 0;
    return (
        <div className="px-6 py-4 bg-card rounded-xl">
            <div className="group flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className={`flex items-center gap-2 ${isNested ? 'text-md font-medium text-muted-foreground' : 'text-lg font-semibold text-foreground'}`}>
                        {
                            isNested && <ArrowBendDownRight className="w-4 h-4" />
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
                                <DotsThreeVertical className={`${isNested ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onCreateSubfolder}>
                                <Plus className="w-4 h-4" />
                                新增子資料夾
                            </DropdownMenuItem>
                            {hasSubfolders && onOrganizeSubfolders && (
                                <DropdownMenuItem onClick={onOrganizeSubfolders}>
                                    <ArrowsDownUp className="w-4 h-4" />
                                    排序子資料夾
                                </DropdownMenuItem>
                            )}
                            {isNested && (
                                <DropdownMenuItem onClick={onCreateBookmark}>
                                    <Plus className="w-4 h-4" />
                                    新增書籤
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={onEdit}>
                                <PencilSimple className="w-4 h-4" />
                                編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash className="w-4 h-4" />
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
