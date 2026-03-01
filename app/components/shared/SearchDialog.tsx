import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { XIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import type { TabData, Tag } from "~/lib/types";
import { isTagsTab } from "~/lib/types";
import { extractAllBookmarks, filterByQuery, type SearchResult } from "~/lib/search";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: TabData[];
  onNavigateToTab?: (tabId: string) => void;
  themeStyle?: React.CSSProperties;
}

/** 將文字中匹配到的 keywords 用 primary 色標亮 */
function highlightText(text: string, keywords: string[]): ReactNode {
  if (!keywords.length || !text) return text;

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function SearchDialog({ open, onOpenChange, tabs, onNavigateToTab, themeStyle }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce 200ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset activeIndex when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  // Build tagGroupId -> color map from all tags tabs
  const tagColorMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const tab of tabs) {
      if (isTagsTab(tab)) {
        for (const tg of tab.tagGroups) {
          map[tg.id] = tg.color;
        }
      }
    }
    return map;
  }, [tabs]);

  const allBookmarks = useMemo(() => extractAllBookmarks(tabs), [tabs]);
  const filtered = useMemo(
    () => filterByQuery(allBookmarks, debouncedQuery),
    [allBookmarks, debouncedQuery]
  );

  const keywords = useMemo(
    () => debouncedQuery.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [debouncedQuery]
  );

  const openResult = useCallback((r: SearchResult) => {
    window.open(r.bookmark.url, "_self");
  }, []);

  const buildPath = (r: SearchResult): string => {
    if (r.folderPath) return `${r.tabTitle} / ${r.folderPath}`;
    return r.tabTitle;
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && filtered[activeIndex]) {
      e.preventDefault();
      openResult(filtered[activeIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[680px] p-0 gap-0 !top-[15vh] !translate-y-0 rounded-2xl overflow-hidden"
        style={themeStyle}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">搜尋書籤</DialogTitle>

        {/* Search input */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋..."
            className="flex-1 bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/50 placeholder:font-bold focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-4"
            >
              <XIcon className="w-5 h-5" />
            </button>
          ) : (
            <KbdGroup className="flex-shrink-0 ml-4 opacity-50">
              <Kbd>Ctrl</Kbd>
              <span className="text-muted-foreground text-xs">+</span>
              <Kbd>K</Kbd>
            </KbdGroup>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
          {debouncedQuery && filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              找不到符合「{debouncedQuery}」的書籤
            </div>
          )}

          {filtered.map((r, i) => (
            <div
              key={r.bookmark.id}
              onClick={() => openResult(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-6 py-3 border-b border-border/60 cursor-pointer transition-colors ${i === activeIndex ? "bg-card" : ""}`}
            >
              {/* Row 1: Title + LinkIcon ...... Folder path */}
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-foreground truncate">
                  {highlightText(r.bookmark.title, keywords)}
                </span>
                {r.bookmark.url && (
                  <LinkSimpleIcon
                    className="flex-shrink-0 text-muted-foreground"
                    size={14}
                  />
                )}
                <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {highlightText(buildPath(r), keywords)}
                </span>
              </div>
              {/* Row 2: Tags */}
              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {r.tags.map((tag: Tag) => {
                    const color = tagColorMap[tag.tag_group_id] || null;
                    return (
                      <span
                        key={tag.id}
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: color ? `${color}20` : "hsl(var(--secondary))",
                          color: color || "hsl(var(--muted-foreground))",
                        }}
                      >
                        {highlightText(tag.title, keywords)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!debouncedQuery && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            輸入關鍵字搜尋所有書籤
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
