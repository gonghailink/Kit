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
import { PencilSimpleIcon, TrashIcon, DotsSixVerticalIcon, PlusIcon } from "@phosphor-icons/react";
import type { Workspace } from "~/components/page-ui/dashboard/WorkspaceSwitcher";

interface OrganizeWorkspacesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaces: Workspace[];
    onReorder: (newWorkspaces: Workspace[]) => void;
    onAddWorkspace: () => void;
    onEditWorkspace: (workspace: Workspace) => void;
    onDeleteWorkspace: (workspace: Workspace) => void;
}

export function OrganizeWorkspacesSheet({
    open,
    onOpenChange,
    workspaces,
    onReorder,
    onAddWorkspace,
    onEditWorkspace,
    onDeleteWorkspace,
}: OrganizeWorkspacesSheetProps) {
    const [localWorkspaces, setLocalWorkspaces] = useState(workspaces);

    useEffect(() => {
        setLocalWorkspaces(workspaces);
    }, [workspaces]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localWorkspaces.findIndex((w) => w.id === active.id);
            const newIndex = localWorkspaces.findIndex((w) => w.id === over.id);

            const newItems = arrayMove(localWorkspaces, oldIndex, newIndex);
            setLocalWorkspaces(newItems);
            onReorder(newItems);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-2xl font-bold text-left px-2">工作區管理</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                    {/* Add Workspace Button */}
                    <button
                        onClick={onAddWorkspace}
                        className="w-full flex items-center gap-4 p-4 px-6 mb-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-colors"
                    >
                        <PlusIcon className="w-6 h-6 text-foreground" />
                        <span className="text-lg font-medium text-foreground">新增工作區</span>
                    </button>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={localWorkspaces.map((w) => w.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {localWorkspaces.map((workspace) => (
                                    <SortableWorkspaceRow
                                        key={workspace.id}
                                        workspace={workspace}
                                        onEdit={() => onEditWorkspace(workspace)}
                                        onDelete={() => onDeleteWorkspace(workspace)}
                                        canDelete={localWorkspaces.length > 1}
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

function SortableWorkspaceRow({
    workspace,
    onEdit,
    onDelete,
    canDelete
}: {
    workspace: Workspace;
    onEdit: () => void;
    onDelete: () => void;
    canDelete: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: workspace.id });

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
                flex items-center gap-2 p-4 px-4 rounded-2xl bg-card shadow-sm
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
            <span className="flex-1 text-lg font-medium text-foreground">{workspace.title}</span>
            <button
                onClick={onEdit}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <PencilSimpleIcon className="w-5 h-5" />
            </button>
            {canDelete && (
                <button
                    onClick={onDelete}
                    className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
