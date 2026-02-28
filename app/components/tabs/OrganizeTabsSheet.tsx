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
import { NotePencilIcon, TrashIcon, DotsSixVerticalIcon, PlusIcon, UploadSimpleIcon, DownloadSimpleIcon, DotsThreeIcon } from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { TabData } from "~/lib/types";

interface OrganizeTabsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabs: TabData[];
    onReorder: (newTabs: TabData[]) => void;
    onAddTab: () => void;
    onEditTab: (tab: TabData) => void;
    onDeleteTab: (tab: TabData) => void;
    onImport: () => void;
    onExportTab: (tab: TabData) => void;
}

export function OrganizeTabsSheet({
    open,
    onOpenChange,
    tabs,
    onReorder,
    onAddTab,
    onEditTab,
    onDeleteTab,
    onImport,
    onExportTab,
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
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-2xl font-bold text-left px-2">Tab 管理</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                    {/* Add Tab & Import Buttons */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={onAddTab}
                            className="flex-1 flex items-center gap-4 px-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-colors"
                        >
                            <PlusIcon className="w-6 h-6 text-foreground" />
                            <span className="font-medium text-foreground">Add Tab</span>
                        </button>
                        <button
                            onClick={onImport}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-colors"
                            title="匯入書籤"
                        >
                            <UploadSimpleIcon className="w-6 h-6 text-foreground" />
                        </button>
                    </div>

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
                                        onExport={() => onExportTab(tab)}
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

function SortableTabRow({ tab, onEdit, onDelete, onExport }: { tab: TabData; onEdit: () => void; onDelete: () => void; onExport: () => void }) {
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
                flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-card shadow-sm
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
            <span className="flex-1 font-medium text-foreground">{tab.title}</span>
            <button
                onClick={onEdit}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <NotePencilIcon className="w-5 h-5" />
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <DotsThreeIcon className="w-5 h-5" weight="bold" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onExport}>
                        <DownloadSimpleIcon className="w-4 h-4 mr-2" />
                        匯出
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                        <TrashIcon className="w-4 h-4 mr-2" />
                        刪除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
