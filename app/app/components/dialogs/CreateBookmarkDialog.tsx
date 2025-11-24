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

interface CreateBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName?: string;
}

export default function CreateBookmarkDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
}: CreateBookmarkDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      setTitle("");
      setUrl("");
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("folder_id", folderId);
    formData.append("title", title.trim());
    formData.append("url", url.trim());

    fetcher.submit(formData, {
      method: "post",
      action: "/api/bookmarks",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增書籤</DialogTitle>
          <DialogDescription>
            {folderName ? `新增書籤到「${folderName}」` : "新增一個新的書籤"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !url.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
