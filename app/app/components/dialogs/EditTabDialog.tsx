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
import type { Tab } from "~/lib/types";

interface EditTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: Tab;
}

export default function EditTabDialog({ open, onOpenChange, tab }: EditTabDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState(tab.title);
  const isSubmitting = fetcher.state === "submitting";

  // 當 tab 改變時更新 title
  useEffect(() => {
    setTitle(tab.title);
  }, [tab.title]);

  // 成功後關閉對話框並重新載入
  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    fetcher.submit(
      {
        intent: "update",
        id: tab.id,
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
          <DialogTitle>編輯 Tab</DialogTitle>
          <DialogDescription>
            修改 Tab 的名稱
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tab-title">Tab 名稱</Label>
              <Input
                id="edit-tab-title"
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
