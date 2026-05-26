import { Plus, DotsThreeVertical, PencilSimple, Trash, ArrowBendDownRight, ArrowsDownUp, ArrowBendDownRightIcon, PlusIcon, DotsThreeVerticalIcon, ArrowsDownUpIcon, TrashIcon } from "@phosphor-icons/react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import type { FolderWithChildren } from "~/lib/types";
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

export const FOLDER_DROPPABLE_PREFIX = "folder-droppable-";

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
    const { setNodeRef } = useDroppable({
        id: `${FOLDER_DROPPABLE_PREFIX}${folder.id}`,
        data: { type: "folder", folderId: folder.id },
    });
    // closestCenter 在拖到資料夾內書籤上時不會讓 folder 自己 isOver。
    // 改用 DndContext 的 over 狀態，自行判斷「目前拖曳是否屬於這個資料夾」（含拖到內部書籤的情況），整張卡才會一致高亮。
    const { active, over } = useDndContext();
    const isOver = (() => {
        if (!active || !over) return false;
        const overData = over.data.current as { type?: string; folderId?: string } | undefined;
        if (overData?.type === "folder" && overData.folderId === folder.id) return true;
        if (folder.bookmarks?.some((b) => b.id === over.id)) return true;
        return false;
    })();
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    className={`px-6 pt-4 pb-5 rounded-xl bg-transparent transition-all ${isOver ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent bg-primary/5" : ""}`}
                >
                    <div className="group flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className={`flex items-center gap-2 text-foreground ${isNested ? 'text-md font-medium' : 'text-lg font-semibold'}`}>
                                {
                                    isNested && <ArrowBendDownRightIcon className="w-4 h-4" />
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
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <DotsThreeVerticalIcon className={`${isNested ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onCreateSubfolder}>
                                        <PlusIcon className="w-4 h-4" />
                                        新增子資料夾
                                    </DropdownMenuItem>
                                    {hasSubfolders && onOrganizeSubfolders && (
                                        <DropdownMenuItem onClick={onOrganizeSubfolders}>
                                            <ArrowsDownUpIcon className="w-4 h-4" />
                                            排序子資料夾
                                        </DropdownMenuItem>
                                    )}
                                    {isNested && (
                                        <DropdownMenuItem onClick={onCreateBookmark}>
                                            <PlusIcon className="w-4 h-4" />
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
                                        <TrashIcon className="w-4 h-4" />
                                        刪除
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {children}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={onCreateSubfolder}>
                    <PlusIcon className="w-4 h-4" />
                    新增子資料夾
                </ContextMenuItem>
                {hasSubfolders && onOrganizeSubfolders && (
                    <ContextMenuItem onClick={onOrganizeSubfolders}>
                        <ArrowsDownUpIcon className="w-4 h-4" />
                        排序子資料夾
                    </ContextMenuItem>
                )}
                {isNested && (
                    <ContextMenuItem onClick={onCreateBookmark}>
                        <PlusIcon className="w-4 h-4" />
                        新增書籤
                    </ContextMenuItem>
                )}
                <ContextMenuItem onClick={onEdit}>
                    <PencilSimple className="w-4 h-4" />
                    編輯
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <TrashIcon className="w-4 h-4" />
                    刪除
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
