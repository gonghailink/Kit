import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Folder as FolderIcon, Tag as TagIcon } from "@phosphor-icons/react";
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

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function EditTabDialog({ open, onOpenChange, tab }: EditTabDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState(tab.title);
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 當 tab 改變時更新 title
  useEffect(() => {
    setTitle(tab.title);
  }, [tab.title]);

  // 成功後關閉對話框
  useEffect(() => {
    if (submitted.current && fetcher.data && "success" in fetcher.data && fetcher.data.success && fetcher.state === "idle") {
      submitted.current = false;
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    submitted.current = true;
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
          <div className="space-y-4">
            <div className="space-y-2 p-4 mb-4 bg-card/80 rounded-lg">
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

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {tab.type === "tags" ? (
                <>
                  <TagIcon className="w-4 h-4" />
                  <span>標籤模式（建立後不可變更）</span>
                </>
              ) : (
                <>
                  <FolderIcon className="w-4 h-4" />
                  <span>資料夾模式（建立後不可變更）</span>
                </>
              )}
            </div>

            {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
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
