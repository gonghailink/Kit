import { useState, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import {
  Plus,
  Trash,
  PencilSimple,
  CaretDown,
  CaretRight,
  DotsSixVertical,
  DotsSixVerticalIcon,
  CaretDownIcon,
  CaretRightIcon,
  PencilSimpleIcon,
  TrashIcon,
  PlusIcon,
} from "@phosphor-icons/react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import type { TagGroupWithTags, Tag, FilterMode } from "~/lib/types";

interface ManageTagGroupsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabId: string;
  tagGroups: TagGroupWithTags[];
}

function ColorInput({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <label className="relative w-7 h-7 flex-shrink-0 cursor-pointer">
      <span
        className="block w-full h-full rounded-full border border-border"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </label>
  );
}

export function ManageTagGroupsSheet({
  open,
  onOpenChange,
  tabId,
  tagGroups,
}: ManageTagGroupsSheetProps) {
  const tagGroupFetcher = useFetcher();
  const tagFetcher = useFetcher();
  const revalidator = useRevalidator();

  // Local state for drag-and-drop
  const [localTagGroups, setLocalTagGroups] = useState(tagGroups);

  useEffect(() => {
    setLocalTagGroups(tagGroups);
  }, [tagGroups]);

  // 新增 TagGroup
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupColor, setNewGroupColor] = useState<string>("#FADB15");
  // 新增 Tag
  const [addingTagGroupId, setAddingTagGroupId] = useState<string | null>(null);
  const [newTagTitle, setNewTagTitle] = useState("");
  // 展開的 TagGroup
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(tagGroups.map((tg) => tg.id))
  );
  // 編輯中的 TagGroup
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState("");
  const [editingGroupColor, setEditingGroupColor] = useState("");
  const [editingGroupFilterMode, setEditingGroupFilterMode] = useState<FilterMode>("or");
  // 編輯中的 Tag
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagTitle, setEditingTagTitle] = useState("");

  // dnd-kit sensors
  const groupSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tagSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddGroup = () => {
    if (!newGroupTitle.trim()) return;
    tagGroupFetcher.submit(
      { intent: "create", tab_id: tabId, title: newGroupTitle.trim(), color: newGroupColor },
      { method: "post", action: "/api/tag-groups" }
    );
    setNewGroupTitle("");
    revalidator.revalidate();
  };

  const handleDeleteGroup = (id: string) => {
    tagGroupFetcher.submit(
      { intent: "delete", id },
      { method: "post", action: "/api/tag-groups" }
    );
    revalidator.revalidate();
  };

  const handleUpdateGroup = (id: string) => {
    if (!editingGroupTitle.trim()) return;
    tagGroupFetcher.submit(
      { intent: "update", id, title: editingGroupTitle.trim(), color: editingGroupColor, filter_mode: editingGroupFilterMode },
      { method: "post", action: "/api/tag-groups" }
    );
    setEditingGroupId(null);
    revalidator.revalidate();
  };

  const handleToggleFilterMode = (tagGroup: TagGroupWithTags) => {
    const newMode: FilterMode = tagGroup.filter_mode === "or" ? "and" : tagGroup.filter_mode === "and" ? "single" : "or";
    tagGroupFetcher.submit(
      { intent: "update", id: tagGroup.id, filter_mode: newMode },
      { method: "post", action: "/api/tag-groups" }
    );
    revalidator.revalidate();
  };

  const handleAddTag = (tagGroupId: string) => {
    if (!newTagTitle.trim()) return;
    tagFetcher.submit(
      { intent: "create", tag_group_id: tagGroupId, title: newTagTitle.trim() },
      { method: "post", action: "/api/tags" }
    );
    setNewTagTitle("");
    setAddingTagGroupId(null);
    revalidator.revalidate();
  };

  const handleDeleteTag = (id: string) => {
    tagFetcher.submit(
      { intent: "delete", id },
      { method: "post", action: "/api/tags" }
    );
    revalidator.revalidate();
  };

  const handleUpdateTag = (id: string) => {
    if (!editingTagTitle.trim()) return;
    tagFetcher.submit(
      { intent: "update", id, title: editingTagTitle.trim() },
      { method: "post", action: "/api/tags" }
    );
    setEditingTagId(null);
    revalidator.revalidate();
  };

  // Tag group drag end
  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localTagGroups.findIndex((g) => g.id === active.id);
    const newIndex = localTagGroups.findIndex((g) => g.id === over.id);
    const newGroups = arrayMove(localTagGroups, oldIndex, newIndex);
    setLocalTagGroups(newGroups);

    const ids = newGroups.map((g) => g.id);
    const sortOrders = newGroups.map((_, i) => (i + 1) * 1000);
    tagGroupFetcher.submit(
      {
        intent: "reorder",
        ids: JSON.stringify(ids),
        sortOrders: JSON.stringify(sortOrders),
      },
      { method: "post", action: "/api/tag-groups" }
    );
    revalidator.revalidate();
  };

  // Tag drag end (within a group)
  const handleTagDragEnd = (groupId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalTagGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const oldIndex = group.tags.findIndex((t) => t.id === active.id);
        const newIndex = group.tags.findIndex((t) => t.id === over.id);
        const newTags = arrayMove(group.tags, oldIndex, newIndex);

        const ids = newTags.map((t) => t.id);
        const sortOrders = newTags.map((_, i) => (i + 1) * 1000);
        tagFetcher.submit(
          {
            intent: "reorder",
            ids: JSON.stringify(ids),
            sortOrders: JSON.stringify(sortOrders),
          },
          { method: "post", action: "/api/tags" }
        );
        revalidator.revalidate();

        return { ...group, tags: newTags };
      })
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl font-bold text-left">管理標籤群組</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-4">
          <DndContext
            sensors={groupSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={localTagGroups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {localTagGroups.map((tagGroup) => (
                <SortableTagGroup
                  key={tagGroup.id}
                  tagGroup={tagGroup}
                  isExpanded={expandedGroups.has(tagGroup.id)}
                  onToggle={() => toggleGroup(tagGroup.id)}
                  onToggleFilterMode={() => handleToggleFilterMode(tagGroup)}
                  editingGroupId={editingGroupId}
                  editingGroupTitle={editingGroupTitle}
                  editingGroupColor={editingGroupColor}
                  editingGroupFilterMode={editingGroupFilterMode}
                  onSetEditingGroup={(id, title, color, filterMode) => {
                    setEditingGroupId(id);
                    setEditingGroupTitle(title);
                    setEditingGroupColor(color);
                    setEditingGroupFilterMode(filterMode);
                  }}
                  onCancelEditGroup={() => setEditingGroupId(null)}
                  onUpdateGroup={handleUpdateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onEditingGroupTitleChange={setEditingGroupTitle}
                  onEditingGroupColorChange={setEditingGroupColor}
                  onEditingGroupFilterModeChange={setEditingGroupFilterMode}
                  // Tag props
                  editingTagId={editingTagId}
                  editingTagTitle={editingTagTitle}
                  onSetEditingTag={(id, title) => {
                    setEditingTagId(id);
                    setEditingTagTitle(title);
                  }}
                  onCancelEditTag={() => setEditingTagId(null)}
                  onUpdateTag={handleUpdateTag}
                  onDeleteTag={handleDeleteTag}
                  onEditingTagTitleChange={setEditingTagTitle}
                  addingTagGroupId={addingTagGroupId}
                  newTagTitle={newTagTitle}
                  onSetAddingTag={(groupId) => {
                    setAddingTagGroupId(groupId);
                    setNewTagTitle("");
                  }}
                  onCancelAddTag={() => setAddingTagGroupId(null)}
                  onAddTag={handleAddTag}
                  onNewTagTitleChange={setNewTagTitle}
                  tagSensors={tagSensors}
                  onTagDragEnd={handleTagDragEnd(tagGroup.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add TagGroup */}
          <div className="space-y-2 p-3 border rounded-xl">
            <div className="flex items-center gap-2">
              <ColorInput value={newGroupColor} onValueChange={setNewGroupColor} />
              <Input
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                placeholder="新增標籤群組名稱..."
                className="h-9 border-0 shadow-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddGroup();
                }}
              />
              <Button onClick={handleAddGroup} disabled={!newGroupTitle.trim()} className="rounded-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Sortable Tag Group ---

interface SortableTagGroupProps {
  tagGroup: TagGroupWithTags;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleFilterMode: () => void;
  editingGroupId: string | null;
  editingGroupTitle: string;
  editingGroupColor: string;
  editingGroupFilterMode: FilterMode;
  onSetEditingGroup: (id: string, title: string, color: string, filterMode: FilterMode) => void;
  onCancelEditGroup: () => void;
  onUpdateGroup: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onEditingGroupTitleChange: (v: string) => void;
  onEditingGroupColorChange: (v: string) => void;
  onEditingGroupFilterModeChange: (v: FilterMode) => void;
  // Tag props
  editingTagId: string | null;
  editingTagTitle: string;
  onSetEditingTag: (id: string, title: string) => void;
  onCancelEditTag: () => void;
  onUpdateTag: (id: string) => void;
  onDeleteTag: (id: string) => void;
  onEditingTagTitleChange: (v: string) => void;
  addingTagGroupId: string | null;
  newTagTitle: string;
  onSetAddingTag: (groupId: string) => void;
  onCancelAddTag: () => void;
  onAddTag: (groupId: string) => void;
  onNewTagTitleChange: (v: string) => void;
  tagSensors: ReturnType<typeof useSensors>;
  onTagDragEnd: (event: DragEndEvent) => void;
}

function SortableTagGroup({
  tagGroup,
  isExpanded,
  onToggle,
  onToggleFilterMode,
  editingGroupId,
  editingGroupTitle,
  editingGroupColor,
  editingGroupFilterMode,
  onSetEditingGroup,
  onCancelEditGroup,
  onUpdateGroup,
  onDeleteGroup,
  onEditingGroupTitleChange,
  onEditingGroupColorChange,
  onEditingGroupFilterModeChange,
  editingTagId,
  editingTagTitle,
  onSetEditingTag,
  onCancelEditTag,
  onUpdateTag,
  onDeleteTag,
  onEditingTagTitleChange,
  addingTagGroupId,
  newTagTitle,
  onSetAddingTag,
  onCancelAddTag,
  onAddTag,
  onNewTagTitleChange,
  tagSensors,
  onTagDragEnd,
}: SortableTagGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tagGroup.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border overflow-hidden ${isDragging ? "opacity-50" : ""}`}
    >
      {/* TagGroup Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <DotsSixVerticalIcon className="w-4 h-4" />
        </button>

        <button onClick={onToggle} className="text-muted-foreground flex-shrink-0">
          {isExpanded ? (
            <CaretDownIcon className="w-4 h-4" />
          ) : (
            <CaretRightIcon className="w-4 h-4" />
          )}
        </button>

        {editingGroupId === tagGroup.id ? (
          <div className="flex-1 flex items-center gap-2">
            <ColorInput value={editingGroupColor} onValueChange={onEditingGroupColorChange} />
            <Input
              value={editingGroupTitle}
              onChange={(e) => onEditingGroupTitleChange(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onUpdateGroup(tagGroup.id);
                if (e.key === "Escape") onCancelEditGroup();
              }}
            />
            <Select value={editingGroupFilterMode} onValueChange={(v) => onEditingGroupFilterModeChange(v as FilterMode)}>
              <SelectTrigger
                className="h-8 w-20 px-2 rounded-full text-[10px] font-bold uppercase flex-shrink-0"
              >
                <span>{editingGroupFilterMode === "and" ? "AND" : editingGroupFilterMode === "single" ? "單選" : "OR"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="or">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">OR</span>
                    <span className="text-[10px] text-muted-foreground">符合其一</span>
                  </div>
                </SelectItem>
                <SelectItem value="and">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">AND</span>
                    <span className="text-[10px] text-muted-foreground">符合全部</span>
                  </div>
                </SelectItem>
                <SelectItem value="single">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">單選</span>
                    <span className="text-[10px] text-muted-foreground">只能選一個</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => onUpdateGroup(tagGroup.id)}>
              確定
            </Button>
          </div>
        ) : (
          <>
            <span
              className="flex-1 font-medium text-sm"
              style={tagGroup.color ? { color: tagGroup.color } : undefined}
            >{tagGroup.title}</span>
            <button
              onClick={onToggleFilterMode}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all hover:opacity-80"
              style={{
                backgroundColor: tagGroup.color ? `${tagGroup.color}20` : "hsl(var(--secondary))",
                color: tagGroup.color || "hsl(var(--muted-foreground))",
              }}
              title={`篩選模式：${tagGroup.filter_mode === "and" ? "AND（須符合全部）" : tagGroup.filter_mode === "single" ? "單選（只能選一個）" : "OR（符合其一即可）"}`}
            >
              {tagGroup.filter_mode === "and" ? "AND" : tagGroup.filter_mode === "single" ? "單選" : "OR"}
            </button>
            <button
              onClick={() => {
                onSetEditingGroup(
                  tagGroup.id,
                  tagGroup.title,
                  tagGroup.color || "#FADB15",
                  tagGroup.filter_mode || "or"
                );
              }}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <PencilSimpleIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteGroup(tagGroup.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Tags List */}
      {
        isExpanded && (
          <div className="p-3 border-t space-y-2">
            <DndContext
              sensors={tagSensors}
              collisionDetection={closestCenter}
              onDragEnd={onTagDragEnd}
            >
              <SortableContext
                items={tagGroup.tags.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1.5">
                  {tagGroup.tags.map((tag) => (
                    <SortableTag
                      key={tag.id}
                      tag={tag}
                      groupColor={tagGroup.color}
                      editingTagId={editingTagId}
                      editingTagTitle={editingTagTitle}
                      onSetEditingTag={onSetEditingTag}
                      onCancelEditTag={onCancelEditTag}
                      onUpdateTag={onUpdateTag}
                      onDeleteTag={onDeleteTag}
                      onEditingTagTitleChange={onEditingTagTitleChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Tag */}
            {addingTagGroupId === tagGroup.id ? (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newTagTitle}
                  onChange={(e) => onNewTagTitleChange(e.target.value)}
                  placeholder="標籤名稱"
                  className="h-8 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onAddTag(tagGroup.id);
                    if (e.key === "Escape") onCancelAddTag();
                  }}
                />
                <Button size="sm" onClick={() => onAddTag(tagGroup.id)}>
                  新增
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onSetAddingTag(tagGroup.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1 pt-2"
              >
                <PlusIcon className="w-3 h-3" />
                新增標籤
              </button>
            )}
          </div>
        )
      }
    </div >
  );
}

// --- Sortable Tag ---

interface SortableTagProps {
  tag: Tag;
  groupColor: string | null;
  editingTagId: string | null;
  editingTagTitle: string;
  onSetEditingTag: (id: string, title: string) => void;
  onCancelEditTag: () => void;
  onUpdateTag: (id: string) => void;
  onDeleteTag: (id: string) => void;
  onEditingTagTitleChange: (v: string) => void;
}

function SortableTag({
  tag,
  groupColor,
  editingTagId,
  editingTagTitle,
  onSetEditingTag,
  onCancelEditTag,
  onUpdateTag,
  onDeleteTag,
  onEditingTagTitleChange,
}: SortableTagProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  if (editingTagId === tag.id) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-1 p-1 border rounded-lg">
        <Input
          value={editingTagTitle}
          onChange={(e) => onEditingTagTitleChange(e.target.value)}
          className="h-6 text-xs w-24"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onUpdateTag(tag.id);
            if (e.key === "Escape") onCancelEditTag();
          }}
        />
        <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => onUpdateTag(tag.id)}>
          OK
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <DotsSixVertical className="w-3 h-3" />
      </button>
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80"
        style={{
          backgroundColor: groupColor ? `${groupColor}20` : "hsl(var(--secondary))",
          color: groupColor || "hsl(var(--foreground))",
        }}
        onClick={() => onSetEditingTag(tag.id, tag.title)}
      >
        {tag.title}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTag(tag.id);
          }}
          className="ml-0.5 hover:text-destructive"
        >
          ×
        </button>
      </span>
    </div>
  );
}
