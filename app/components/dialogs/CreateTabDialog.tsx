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

interface CreateTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTabDialog({ open, onOpenChange }: CreateTabDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const isSubmitting = fetcher.state === "submitting";

  // 成功後關閉對話框並重置
  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      setTitle("");
      onOpenChange(false);
      // 重新載入頁面以更新資料
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    fetcher.submit(
      {
        intent: "create",
        title: title.trim(),
      },
      {
        method: "post",
        action: "/api/tabs",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>建立新 Tab</DialogTitle>
          <DialogDescription>
            建立一個新的 Tab 來組織您的書籤
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-title">Tab 名稱</Label>
              <Input
                id="tab-title"
                placeholder="例如：工作、學習、娛樂"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
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
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  建立中...
                </>
              ) : (
                "建立"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
