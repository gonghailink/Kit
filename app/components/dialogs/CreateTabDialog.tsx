import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Loader2, FolderIcon, TagIcon } from "lucide-react";
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
import type { TabType } from "~/lib/types";

interface CreateTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function CreateTabDialog({ open, onOpenChange, workspaceId }: CreateTabDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TabType>("folders");
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 成功後關閉對話框並重置
  useEffect(() => {
    if (submitted.current && fetcher.data && "success" in fetcher.data && fetcher.data.success && fetcher.state === "idle") {
      submitted.current = false;
      setTitle("");
      setType("folders");
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;

    submitted.current = true;
    fetcher.submit(
      {
        intent: "create",
        title: title.trim(),
        workspace_id: workspaceId,
        type,
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
          <div className="space-y-4">
            <div className="space-y-2 p-4 mb-4 bg-card/80 rounded-lg">
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

            {/* Tab 模式選擇 */}
            <div className="space-y-2">
              <Label>組織方式</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("folders")}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                    ${type === "folders"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                    }
                  `}
                >
                  <FolderIcon className={`w-6 h-6 ${type === "folders" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`text-sm font-medium ${type === "folders" ? "text-primary" : "text-foreground"}`}>
                      資料夾模式
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      用資料夾分類書籤
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setType("tags")}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                    ${type === "tags"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                    }
                  `}
                >
                  <TagIcon className={`w-6 h-6 ${type === "tags" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`text-sm font-medium ${type === "tags" ? "text-primary" : "text-foreground"}`}>
                      標籤模式
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      用標籤分類與篩選
                    </p>
                  </div>
                </button>
              </div>
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
