import type { TagGroupWithTags } from "~/lib/types";

interface TagFilterBarProps {
  tagGroups: TagGroupWithTags[];
  selectedTagIds: Set<string>;
  onToggleTag: (tagId: string) => void;
  onClearGroupFilters: (tagGroup: TagGroupWithTags) => void;
  onClearAllFilters: () => void;
  hasGroupSelection: (tagGroup: TagGroupWithTags) => boolean;
}

export function TagFilterBar({
  tagGroups,
  selectedTagIds,
  onToggleTag,
  onClearGroupFilters,
  onClearAllFilters,
  hasGroupSelection,
}: TagFilterBarProps) {
  if (tagGroups.length === 0) return null;

  return (
    <div className="mb-6 bg-card/85 rounded-lg border-none p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">篩選器</h2>
        {selectedTagIds.size > 0 && (
          <button
            onClick={onClearAllFilters}
            className="pl-2 pr-2.5 pb-0 pt0.5 mt-1 text-primary hover:bg-primary/10 rounded-full text-sm italic hover:underline underline-offset-4"
          >
            清除篩選
          </button>
        )}
      </div>
      {tagGroups.map((tagGroup) => {
        const groupColor = tagGroup.color;
        return (
          <div key={tagGroup.id} className="space-y-2">
            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
              {tagGroup.title}
              <span className="text-[8px] font-bold uppercase opacity-50 mt-2">
                {tagGroup.filter_mode === "and" ? "AND" : tagGroup.filter_mode === "single" ? "單選" : "OR"}
              </span>
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => onClearGroupFilters(tagGroup)}
                className="px-4 py-1.5 rounded-full font-medium transition-all"
                style={{
                  backgroundColor: !hasGroupSelection(tagGroup)
                    ? (groupColor || "hsl(var(--foreground))")
                    : (groupColor ? `${groupColor}20` : "hsl(var(--secondary))"),
                  color: !hasGroupSelection(tagGroup)
                    ? "white"
                    : (groupColor || "hsl(var(--foreground))"),
                  opacity: !hasGroupSelection(tagGroup) ? 1 : 0.7,
                }}
              >
                全部
              </button>
              {tagGroup.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onToggleTag(tag.id)}
                  className="px-4 py-1.5 rounded-full font-medium transition-all hover:opacity-100"
                  style={{
                    backgroundColor: selectedTagIds.has(tag.id)
                      ? (groupColor || "hsl(var(--foreground))")
                      : (groupColor ? `${groupColor}20` : "hsl(var(--secondary))"),
                    color: selectedTagIds.has(tag.id)
                      ? "white"
                      : (groupColor || "hsl(var(--foreground))"),
                    opacity: selectedTagIds.has(tag.id) ? 1 : 0.7,
                  }}
                >
                  {tag.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
