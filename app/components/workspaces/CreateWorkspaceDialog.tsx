import { useFetcher } from "react-router";
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

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 成功後關閉對話框並重置
  useEffect(() => {
    if (
      submitted.current &&
      fetcher.data &&
      "success" in fetcher.data &&
      fetcher.data.success &&
      fetcher.state === "idle"
    ) {
      submitted.current = false;
      setTitle("");
      onOpenChange(false);
    }
  }, [fetcher.data, fetcher.state, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    submitted.current = true;
    fetcher.submit(
      {
        intent: "create",
        title: title.trim(),
      },
      {
        method: "post",
        action: "/api/workspaces",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增工作區</DialogTitle>
          <DialogDescription>
            建立一個新的工作區來組織您的書籤
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 border-t">
            <div className="grid gap-2">
              <Label htmlFor="title">工作區名稱</Label>
              <Input
                id="title"
                placeholder="例如：工作、個人、學習..."
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
