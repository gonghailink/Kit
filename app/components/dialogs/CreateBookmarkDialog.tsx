import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { TagGroupWithTags } from "~/lib/types";

interface CreateBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
  folderName?: string;
  tabId?: string;
  tabName?: string;
  tagGroups?: TagGroupWithTags[];
}

type FetcherData =
  | { error: string; success?: never; bookmark?: never }
  | { success: true; error?: never; bookmark?: { id: string } };

export default function CreateBookmarkDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  tabId,
  tabName,
  tagGroups,
}: CreateBookmarkDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const tagsFetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const isSubmitting = fetcher.state === "submitting" || tagsFetcher.state === "submitting";
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && fetcher.data && "success" in fetcher.data && fetcher.data.success && fetcher.state === "idle") {
      submitted.current = false;
      const bookmarkId = fetcher.data.bookmark?.id;

      // 如果有選擇 tags，先設定 tags 再關閉
      if (bookmarkId && selectedTagIds.size > 0) {
        tagsFetcher.submit(
          {
            intent: "set",
            bookmark_id: bookmarkId,
            tag_ids: JSON.stringify(Array.from(selectedTagIds)),
          },
          {
            method: "post",
            action: "/api/bookmark-tags",
          }
        );
      }

      setTitle("");
      setUrl("");
      setMemo("");
      setSelectedTagIds(new Set());
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const formData = new FormData();
    formData.append("intent", "create");
    if (tabId) {
      formData.append("tab_id", tabId);
    } else if (folderId) {
      formData.append("folder_id", folderId);
    }
    formData.append("title", title.trim());
    formData.append("url", url.trim());
    if (memo.trim()) {
      formData.append("memo", memo.trim());
    }

    submitted.current = true;
    fetcher.submit(formData, {
      method: "post",
      action: "/api/bookmarks",
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const hasTagGroups = tagGroups && tagGroups.length > 0 && tagGroups.some(tg => tg.tags.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增書籤</DialogTitle>
          <DialogDescription>
            {folderName ? `新增書籤到「${folderName}」` : tabName ? `新增書籤到「${tabName}」` : "新增一個新的書籤"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-title">標題</Label>
              <Input
                id="bookmark-title"
                placeholder="例如：Google 首頁"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-url">URL</Label>
              <Input
                id="bookmark-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                網站圖示會自動抓取
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-memo">備註 (選填)</Label>
              <textarea
                id="bookmark-memo"
                placeholder="輸入備註..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Tag 選擇（Tags 模式） */}
            {hasTagGroups && (
              <div className="space-y-2 pb-4">
                <Label>標籤 (選填)</Label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {tagGroups!.map((tg) => {
                    if (tg.tags.length === 0) return null;
                    const groupColor = tg.color;
                    return (
                      <div key={tg.id}>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">{tg.title}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tg.tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-100"
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
              </div>
            )}

            {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
              <div className="text-sm text-destructive">
                {fetcher.data.error}
              </div>
            )}
          </div>

          <DialogFooter className="flex pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-w-20"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !url.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  新增中...
                </>
              ) : (
                "新增"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
