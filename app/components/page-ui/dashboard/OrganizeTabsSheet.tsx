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
import { DotsSixVertical, Plus, Pencil, Trash, PencilSimpleIcon } from "@phosphor-icons/react";
import type { TabData } from "~/lib/types";

interface OrganizeTabsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabs: TabData[];
    onReorder: (newTabs: TabData[]) => void;
    onAddTab: () => void;
    onEditTab: (tab: TabData) => void;
    onDeleteTab: (tab: TabData) => void;
}

export function OrganizeTabsSheet({
    open,
    onOpenChange,
    tabs,
    onReorder,
    onAddTab,
    onEditTab,
    onDeleteTab,
}: OrganizeTabsSheetProps) {
    const [localTabs, setLocalTabs] = useState(tabs);

    useEffect(() => {
        setLocalTabs(tabs);
    }, [tabs]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localTabs.findIndex((t) => t.id === active.id);
            const newIndex = localTabs.findIndex((t) => t.id === over.id);

            const newItems = arrayMove(localTabs, oldIndex, newIndex);
            setLocalTabs(newItems);
            onReorder(newItems);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-[#F9F7F2]">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-2xl font-bold text-left px-2">Tab 管理</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                    {/* Add Tab Button */}
                    <button
                        onClick={onAddTab}
                        className="w-full flex items-center gap-4 p-4 px-6 mb-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-colors"
                    >
                        <Plus className="w-6 h-6 text-foreground" />
                        <span className="text-lg font-medium text-foreground">Add Tab</span>
                    </button>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={localTabs.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {localTabs.map((tab) => (
                                    <SortableTabRow
                                        key={tab.id}
                                        tab={tab}
                                        onEdit={() => onEditTab(tab)}
                                        onDelete={() => onDeleteTab(tab)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function SortableTabRow({ tab, onEdit, onDelete }: { tab: TabData; onEdit: () => void; onDelete: () => void }) {
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
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-center gap-2 p-4 px-4 rounded-2xl bg-[#EFE9DB] shadow-sm
                ${isDragging ? "opacity-50" : "opacity-100"}
            `}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <DotsSixVertical className="w-6 h-6" />
            </button>
            <span className="flex-1 text-lg font-medium text-foreground">{tab.title}</span>
            <button
                onClick={onEdit}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <PencilSimpleIcon className="w-5 h-5" />
            </button>
            <button
                onClick={onDelete}
                className="p-2 text-destructive hover:text-destructive/80 transition-colors"
            >
                <Trash className="w-5 h-5" />
            </button>
        </div>
    );
}
