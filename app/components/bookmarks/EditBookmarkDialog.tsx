import { useFetcher, useRevalidator } from "react-router";
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
import type { Bookmark, TagGroupWithTags } from "~/lib/types";

interface EditBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark;
  tagGroups?: TagGroupWithTags[];
  bookmarkTagIds?: string[];
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function EditBookmarkDialog({
  open,
  onOpenChange,
  bookmark,
  tagGroups,
  bookmarkTagIds,
}: EditBookmarkDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const tagsFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [memo, setMemo] = useState(bookmark.memo || "");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(bookmarkTagIds || [])
  );
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 當切換到不同書籤時才重置表單（避免 bookmarkTagIds 陣列引用變化導致選擇被重置）
  useEffect(() => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setMemo(bookmark.memo || "");
    setSelectedTagIds(new Set(bookmarkTagIds || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmark.id]);

  // 成功後更新 tags 再關閉
  useEffect(() => {
    if (submitted.current && fetcher.data && "success" in fetcher.data && fetcher.data.success && fetcher.state === "idle") {
      submitted.current = false;
      // 如果有 tagGroups（tags 模式），檢查 tags 是否有變動
      if (tagGroups) {
        const original = new Set(bookmarkTagIds || []);
        const current = selectedTagIds;
        const tagsChanged =
          original.size !== current.size ||
          [...original].some((id) => !current.has(id));

        if (tagsChanged) {
          tagsFetcher.submit(
            {
              intent: "set",
              bookmark_id: bookmark.id,
              tag_ids: JSON.stringify(Array.from(current)),
            },
            {
              method: "post",
              action: "/api/bookmark-tags",
            }
          );
          revalidator.revalidate();
        }
      }
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    submitted.current = true;
    fetcher.submit(
      {
        intent: "update",
        id: bookmark.id,
        title: title.trim(),
        url: url.trim(),
        memo: memo.trim(),
      },
      {
        method: "post",
        action: "/api/bookmarks",
      }
    );
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
          <DialogTitle>編輯書籤</DialogTitle>
          <DialogDescription>
            修改書籤的標題、網址或備註
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh] -mx-6 px-7 py-1">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bookmark-title">標題</Label>
                <Input
                  id="edit-bookmark-title"
                  placeholder="例如：Google"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bookmark-url">網址</Label>
                <Input
                  id="edit-bookmark-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bookmark-memo">備註 (選填)</Label>
                <Input
                  id="edit-bookmark-memo"
                  placeholder="例如：常用的搜尋引擎"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
                <div className="text-sm text-destructive">
                  {fetcher.data.error}
                </div>
              )}
            </div>

            {/* Tag 選擇（Tags 模式） */}
            {hasTagGroups && (
              <div className="space-y-2 mb-4">
                <Label>標籤</Label>
                <div className="space-y-3">
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
            <Button type="submit" disabled={isSubmitting || !title.trim() || !url.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                "儲存"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
