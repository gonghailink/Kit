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
import type { Folder } from "~/lib/types";

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Folder;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function EditFolderDialog({ open, onOpenChange, folder }: EditFolderDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState(folder.title);
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    setTitle(folder.title);
  }, [folder.title]);

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success && !isSubmitting) {
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("id", folder.id);
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
          <DialogTitle>編輯資料夾</DialogTitle>
          <DialogDescription>
            修改資料夾的名稱
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-title">資料夾名稱</Label>
              <Input
                id="edit-folder-title"
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
