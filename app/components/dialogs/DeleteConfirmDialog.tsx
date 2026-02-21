import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

type ResourceType = "tab" | "folder" | "bookmark" | "workspace";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceId: string;
  resourceTitle: string;
}

const resourceConfig = {
  workspace: {
    title: "刪除工作區",
    description: "確定要刪除這個工作區嗎？",
    warning: "刪除後，此工作區下的所有 Tabs、資料夾和書籤也會被刪除。",
    action: "/api/workspaces",
  },
  tab: {
    title: "刪除 Tab",
    description: "確定要刪除這個 Tab 嗎？",
    warning: "刪除後，此 Tab 下的所有資料夾和書籤也會被刪除。",
    action: "/api/tabs",
  },
  folder: {
    title: "刪除資料夾",
    description: "確定要刪除這個資料夾嗎？",
    warning: "刪除後，此資料夾下的所有子資料夾和書籤也會被刪除。",
    action: "/api/folders",
  },
  bookmark: {
    title: "刪除書籤",
    description: "確定要刪除這個書籤嗎？",
    warning: "此操作無法復原。",
    action: "/api/bookmarks",
  },
};

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceTitle,
}: DeleteConfirmDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const isSubmitting = fetcher.state === "submitting";
  const config = resourceConfig[resourceType];

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success && !isSubmitting) {
      onOpenChange(false);
      window.location.reload();
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleDelete = () => {
    fetcher.submit(
      {
        intent: "delete",
        id: resourceId,
      },
      {
        method: "post",
        action: config.action,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium mb-2">即將刪除：</p>
            <p className="text-sm text-muted-foreground font-mono">
              {resourceTitle}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{config.warning}</span>
            </p>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                刪除中...
              </>
            ) : (
              "確認刪除"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
