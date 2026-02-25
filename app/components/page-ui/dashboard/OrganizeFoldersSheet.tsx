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
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { FolderWithChildren } from "~/lib/types";

interface OrganizeFoldersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: FolderWithChildren[];
    onReorder: (newFolders: FolderWithChildren[]) => void;
}

export function OrganizeFoldersSheet({
    open,
    onOpenChange,
    folders,
    onReorder,
}: OrganizeFoldersSheetProps) {
    const [localFolders, setLocalFolders] = useState(folders);

    useEffect(() => {
        setLocalFolders(folders);
    }, [folders]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localFolders.findIndex((f) => f.id === active.id);
            const newIndex = localFolders.findIndex((f) => f.id === over.id);

            const newItems = arrayMove(localFolders, oldIndex, newIndex);
            setLocalFolders(newItems);
            onReorder(newItems);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-[#F9F7F2]">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-xl font-bold text-left">排序資料夾</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
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
                                    <SortableFolderRow key={folder.id} folder={folder} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function SortableFolderRow({ folder }: { folder: FolderWithChildren }) {
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
                flex items-center justify-between py-2 px-4 rounded-2xl bg-[#EFE9DB] shadow-sm
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
