import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { FolderWithChildren } from "~/lib/types";

interface OrganizeSubFoldersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentFolder: FolderWithChildren | null;
    onReorder: (parentId: string, newChildren: FolderWithChildren[]) => void;
}

export function OrganizeSubFoldersSheet({
    open,
    onOpenChange,
    parentFolder,
    onReorder,
}: OrganizeSubFoldersSheetProps) {
    const [localFolders, setLocalFolders] = useState<FolderWithChildren[]>([]);

    useEffect(() => {
        setLocalFolders(parentFolder?.children || []);
    }, [parentFolder]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && parentFolder) {
            const oldIndex = localFolders.findIndex((f) => f.id === active.id);
            const newIndex = localFolders.findIndex((f) => f.id === over.id);

            const newItems = arrayMove(localFolders, oldIndex, newIndex);
            setLocalFolders(newItems);
            onReorder(parentFolder.id, newItems);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-xl font-bold text-left">
                        排序子資料夾
                    </SheetTitle>
                    {parentFolder && (
                        <p className="text-sm text-muted-foreground text-left">
                            {parentFolder.title}
                        </p>
                    )}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                    {localFolders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            此資料夾沒有子資料夾
                        </p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={localFolders.map((f) => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {localFolders.map((folder) => (
                                        <SortableSubFolderRow key={folder.id} folder={folder} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function SortableSubFolderRow({ folder }: { folder: FolderWithChildren }) {
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
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-center justify-between py-1.5 px-2 rounded-2xl bg-card shadow-sm
                ${isDragging ? "opacity-50" : "opacity-100"}
            `}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <DotsSixVerticalIcon className="w-6 h-6" />
            </button>
            <span className="flex-1 text-foreground">{folder.title}</span>
        </div>
    );
}
