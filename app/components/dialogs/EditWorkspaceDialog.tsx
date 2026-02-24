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
import type { Workspace } from "~/components/page-ui/dashboard/WorkspaceSwitcher";

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: EditWorkspaceDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 當工作區改變時更新標題
  useEffect(() => {
    if (workspace) {
      setTitle(workspace.title);
    }
  }, [workspace]);

  // 成功後關閉對話框
  useEffect(() => {
    if (
      submitted.current &&
      fetcher.data &&
      "success" in fetcher.data &&
      fetcher.data.success &&
      fetcher.state === "idle"
    ) {
      submitted.current = false;
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspace) return;

    submitted.current = true;
    fetcher.submit(
      {
        intent: "update",
        id: workspace.id,
        title: title.trim(),
      },
      {
        method: "post",
        action: "/api/workspaces",
      }
    );
  };

  if (!workspace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯工作區</DialogTitle>
          <DialogDescription>
            修改工作區的名稱
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">工作區名稱</Label>
              <Input
                id="title"
                placeholder="工作區名稱"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {fetcher.data && "error" in fetcher.data && (
              <p className="text-sm text-destructive">{fetcher.data.error}</p>
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
                  <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
