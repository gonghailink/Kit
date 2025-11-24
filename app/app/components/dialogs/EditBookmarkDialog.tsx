import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import type { Bookmark } from "~/lib/types";

interface EditBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark;
}

export default function EditBookmarkDialog({ open, onOpenChange, bookmark }: EditBookmarkDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [memo, setMemo] = useState(bookmark.memo || "");
  const isSubmitting = fetcher.state === "submitting";

  // 當 bookmark 改變時更新表單
  useEffect(() => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setMemo(bookmark.memo || "");
  }, [bookmark.title, bookmark.url, bookmark.memo]);

  // 成功後關閉對話框並重新載入
  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>編輯書籤</DialogTitle>
          <DialogDescription>
            修改書籤的標題、網址或備註
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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

            {fetcher.data?.error && (
              <div className="text-sm text-destructive">
                {fetcher.data.error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !url.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
