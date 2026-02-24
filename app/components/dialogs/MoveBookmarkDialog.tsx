import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Folder, CaretRight, CaretDown } from "@phosphor-icons/react";
import type { FolderWithChildren, Bookmark } from "~/lib/types";

interface MoveBookmarkDialogProps {
  bookmark: Bookmark | null;
  allFolders: FolderWithChildren[];
  currentFolderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function MoveBookmarkDialog({
  bookmark,
  allFolders,
  currentFolderId,
  open,
  onOpenChange,
}: MoveBookmarkDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      onOpenChange(false);
      setSelectedFolderId(null);
    }
  }, [fetcher.data, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId || !bookmark) return;

    const formData = new FormData();
    formData.append("intent", "move");
    formData.append("id", bookmark.id);
    formData.append("newFolderId", selectedFolderId);

    fetcher.submit(formData, { method: "post", action: "/api/bookmarks" });
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isCurrentFolder = folder.id === currentFolderId;
    const isSelected = folder.id === selectedFolderId;

    return (
      <div key={folder.id}>
        <div className="w-full flex items-center">
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors flex-1
              ${isCurrentFolder
                ? "opacity-50 bg-secondary/40"
                : isSelected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary/60"
              }
            `}
            style={{ marginLeft: `${level * 1.5}rem` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-foreground/10 rounded"
              >
                {isExpanded ? (
                  <CaretDown className="w-4 h-4" />
                ) : (
                  <CaretRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <button
              type="button"
              onClick={() => {
                if (!isCurrentFolder) {
                  setSelectedFolderId(folder.id);
                }
              }}
              disabled={isCurrentFolder}
              className={`flex items-center gap-2 flex-1 min-w-0 text-left ${
                isCurrentFolder ? "cursor-not-allowed" : ""
              }`}
            >
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{folder.title}</span>
              {isCurrentFolder && (
                <span className="text-xs opacity-70">(當前資料夾)</span>
              )}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>移動書籤到其他資料夾</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {bookmark && (
            <div className="bg-secondary/40 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">移動書籤：</p>
              <p className="font-medium truncate">{bookmark.title}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">選擇目標資料夾</label>
            <div className="border border-border rounded-lg p-2 max-h-[400px] overflow-y-auto bg-background/70">
              {allFolders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">沒有可用的資料夾</p>
              ) : (
                <div className="space-y-1">
                  {allFolders.map((folder) => renderFolder(folder, 0))}
                </div>
              )}
            </div>
          </div>

          {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {fetcher.data.error}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFolderId}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "移動中..." : "移動"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
