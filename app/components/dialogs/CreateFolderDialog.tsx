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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabId: string;
  parentId?: string | null;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function CreateFolderDialog({
  open,
  onOpenChange,
  tabId,
  parentId = null,
}: CreateFolderDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success && !isSubmitting) {
      setTitle("");
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("tab_id", tabId);
    if (parentId) {
      formData.append("parent_id", parentId);
    }
    formData.append("title", title.trim());

    fetcher.submit(formData, {
      method: "post",
      action: "/api/folders",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {parentId ? "建立子資料夾" : "建立新資料夾"}
          </DialogTitle>
          <DialogDescription>
            在此 Tab 下建立一個新的資料夾來分類書籤
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-title">資料夾名稱</Label>
              <Input
                id="folder-title"
                placeholder="例如：前端開發、設計資源"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
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
