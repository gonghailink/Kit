import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Folder, ChevronRight, ChevronDown } from "lucide-react";
import type { FolderWithChildren, Bookmark } from "~/lib/types";

interface MoveBookmarkDialogProps {
  bookmark: Bookmark | null;
  allFolders: FolderWithChildren[];
  currentFolderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MoveBookmarkDialog({
  bookmark,
  allFolders,
  currentFolderId,
  open,
  onOpenChange,
}: MoveBookmarkDialogProps) {
  const fetcher = useFetcher();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data?.success) {
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
        <button
          type="button"
          onClick={() => {
            if (!isCurrentFolder) {
              setSelectedFolderId(folder.id);
            }
          }}
          disabled={isCurrentFolder}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors
            ${isCurrentFolder
              ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
              : isSelected
              ? "bg-primary text-primary-foreground"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{folder.title}</span>
          {isCurrentFolder && (
            <span className="text-xs opacity-70">(當前資料夾)</span>
          )}
        </button>

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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">移動書籤：</p>
              <p className="font-medium truncate">{bookmark.title}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">選擇目標資料夾</label>
            <div className="border rounded-lg p-2 max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900">
              {allFolders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">沒有可用的資料夾</p>
              ) : (
                <div className="space-y-1">
                  {allFolders.map((folder) => renderFolder(folder, 0))}
                </div>
              )}
            </div>
          </div>

          {fetcher.data?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {fetcher.data.error}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
