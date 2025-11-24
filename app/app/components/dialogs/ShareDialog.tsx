import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Loader2, Share2, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import type { Share } from "~/lib/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({
  open,
  onOpenChange,
}: ShareDialogProps) {
  const createFetcher = useFetcher<{ share?: Share; success?: boolean; error?: string }>();
  const deleteFetcher = useFetcher();
  const loadFetcher = useFetcher<{ shares?: Share[] }>();

  const [copied, setCopied] = useState(false);

  const isCreating = createFetcher.state === "submitting";
  const shares = loadFetcher.data?.shares || [];
  const hasShare = shares.length > 0;

  // 載入現有的分享連結
  useEffect(() => {
    if (open) {
      loadFetcher.load(`/api/shares`);
    }
  }, [open]);

  // 建立成功後重新載入
  useEffect(() => {
    if (createFetcher.data?.success && !isCreating) {
      loadFetcher.load(`/api/shares`);
    }
  }, [createFetcher.data, isCreating]);

  // 刪除成功後重新載入
  useEffect(() => {
    if (deleteFetcher.data?.success && deleteFetcher.state === "idle") {
      loadFetcher.load(`/api/shares`);
    }
  }, [deleteFetcher.data, deleteFetcher.state]);

  const handleCreate = () => {
    createFetcher.submit(
      {
        intent: "create",
      },
      {
        method: "post",
        action: "/api/shares",
      }
    );
  };

  const handleDelete = (shareId: string) => {
    deleteFetcher.submit(
      {
        intent: "delete",
        id: shareId,
      },
      {
        method: "post",
        action: "/api/shares",
      }
    );
  };

  const handleCopy = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享我的書籤
          </DialogTitle>
          <DialogDescription>
            建立唯讀分享連結，讓其他人可以瀏覽您的所有書籤（不可編輯）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadFetcher.state === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : hasShare ? (
            // 顯示現有分享連結
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">您的分享連結</h3>
              {shares.map((share) => {
                const shareUrl = `${window.location.origin}/share/${share.share_token}`;

                return (
                  <div
                    key={share.id}
                    className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
                  >
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        建立於：{formatDate(share.created_at)}
                      </p>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono flex-1 truncate">
                          {shareUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopy(share.share_token)}
                        className="flex-1 gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            已複製
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            複製連結
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(shareUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(share.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 顯示建立按鈕
            <div className="text-center py-8 space-y-4">
              <div>
                <Share2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  您尚未建立分享連結
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  建立後，任何人都可以透過連結瀏覽您的所有書籤
                </p>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    建立中...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    建立分享連結
                  </>
                )}
              </Button>
              {createFetcher.data?.error && (
                <div className="text-sm text-destructive">
                  {createFetcher.data.error}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
