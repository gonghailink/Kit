import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { TextTIcon, ArrowSquareOutIcon, CheckIcon, CopyIcon, DesktopIcon, CircleNotchIcon, ShareNetworkIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import type { Share } from "~/lib/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type CreateFetcherData =
  | { error: string; success?: never; share?: never }
  | { share: Share; success: true; error?: never };

type DeleteFetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

export default function ShareDialog({
  open,
  onOpenChange,
  workspaceId,
}: ShareDialogProps) {
  const createFetcher = useFetcher<CreateFetcherData>();
  const deleteFetcher = useFetcher<DeleteFetcherData>();
  const loadFetcher = useFetcher<{ shares?: Share[] }>();

  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [extraBtnTitle, setExtraBtnTitle] = useState("");
  const [extraBtnUrl, setExtraBtnUrl] = useState("");

  const isCreating = createFetcher.state === "submitting";
  const shares = loadFetcher.data?.shares || [];
  const hasShare = shares.length > 0;

  // 載入現有的分享連結
  useEffect(() => {
    if (open && workspaceId) {
      loadFetcher.load(`/api/shares?workspace_id=${workspaceId}`);
    }
  }, [open, workspaceId]);

  // 建立成功後重新載入
  useEffect(() => {
    if (createFetcher.data && "success" in createFetcher.data && createFetcher.data.success && !isCreating && workspaceId) {
      loadFetcher.load(`/api/shares?workspace_id=${workspaceId}`);
    }
  }, [createFetcher.data, isCreating, workspaceId]);

  // 刪除成功後重新載入
  useEffect(() => {
    if (deleteFetcher.data && "success" in deleteFetcher.data && deleteFetcher.data.success && deleteFetcher.state === "idle" && workspaceId) {
      loadFetcher.load(`/api/shares?workspace_id=${workspaceId}`);
    }
  }, [deleteFetcher.data, deleteFetcher.state, workspaceId]);

  const handleCreate = () => {
    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("workspace_id", workspaceId);
    if (name.trim()) {
      formData.append("name", name.trim());
    }
    if (shortLink.trim()) {
      formData.append("short_link", shortLink.trim());
    }
    if (extraBtnTitle.trim()) {
      formData.append("extra_btn_title", extraBtnTitle.trim());
    }
    if (extraBtnUrl.trim()) {
      formData.append("extra_btn_url", extraBtnUrl.trim());
    }

    createFetcher.submit(formData, {
      method: "post",
      action: "/api/shares",
    });
  };

  const handleDelete = (shareId: string) => {
    deleteFetcher.submit(
      {
        intent: "delete",
        id: shareId,
        workspace_id: workspaceId,
      },
      {
        method: "post",
        action: "/api/shares",
      }
    );
  };

  const handleCopy = (share: Share) => {
    const shareUrl = share.short_link
      ? `${window.location.origin}/s/${share.short_link}`
      : `${window.location.origin}/share/${share.share_token}`;
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
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            分享我的書籤
          </DialogTitle>
          <DialogDescription>
            建立唯讀分享連結，讓其他人可以瀏覽此工作區的所有書籤（不可編輯）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4 border-t">
          {loadFetcher.state === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotchIcon className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasShare ? (
            // 顯示現有分享連結
            <div className="space-y-3">
              {shares.map((share) => {
                const shareUrl = share.short_link
                  ? `${window.location.origin}/s/${share.short_link}`
                  : `${window.location.origin}/share/${share.share_token}`;

                return (
                  <div
                    key={share.id}
                  >
                    <div className="min-w-0 space-y-4">
                      <div className="px-4 pt-2 pb-1.5 rounded-full min-w-0 border text-foreground">
                        <p className="text-sm font-mono break-all">
                          {shareUrl}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {share.name && (
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                            <TextTIcon className="w-4 h-4" /> {share.name}
                          </p>
                        )}
                        {share.extra_btn_title && share.extra_btn_url && (
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                            <ArrowSquareOutIcon className="w-4 h-4" /> {share.extra_btn_title}
                            <span className="text-muted-foreground/50">({share.extra_btn_url})</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleCopy(share)}
                        className="flex-1 gap-2 rounded-full"
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            已複製
                          </>
                        ) : (
                          <>
                            <CopyIcon className="w-4 h-4" />
                            複製連結
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => window.open(shareUrl, "_blank")}
                      >
                        <ArrowSquareOutIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => handleDelete(share.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 顯示建立按鈕
            <div className="space-y-6">
              <div className="bg-card/80 p-3 rounded-lg text-center flex flex-col md:flex-row justify-center items-center gap-4 px-6 py-4">
                <DesktopIcon className="w-16 h-16 text-background p-4 rounded-lg bg-primary/90" />
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground mb-2">
                    您尚未建立分享連結
                  </p>
                  <p className="text-sm text-muted-foreground">
                    建立後，任何人都可以透過連結瀏覽此工作區的所有書籤
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 ">
                  <label className="block text-sm font-medium">
                    顯示名稱（選填）
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：小明"
                    className="w-full px-3 py-2 border border-input rounded-full bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    自訂短網址（選填）
                  </label>
                  <p className="text-xs text-muted-foreground">
                    留空則使用隨機產生的長網址。只能使用英數字、底線和連字號。
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/s/</span>
                    <input
                      type="text"
                      value={shortLink}
                      onChange={(e) => setShortLink(e.target.value)}
                      placeholder="例如：myBookmarks"
                      className="flex-1 px-3 py-2 border border-input rounded-full bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    附加按鈕（選填）
                  </label>
                  <p className="text-xs text-muted-foreground">
                    在分享頁面右上角顯示自訂按鈕，兩個欄位都需填寫才會顯示。
                  </p>
                  <input
                    type="text"
                    value={extraBtnTitle}
                    onChange={(e) => setExtraBtnTitle(e.target.value)}
                    placeholder="按鈕文字，例如：聯絡我"
                    className="w-full px-3 py-2 border border-input rounded-full bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                  <input
                    type="url"
                    value={extraBtnUrl}
                    onChange={(e) => setExtraBtnUrl(e.target.value)}
                    placeholder="按鈕連結，例如：https://example.com"
                    className="w-full px-3 py-2 border border-input rounded-full bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="gap-2 w-full"
              >
                {isCreating ? (
                  <>
                    <CircleNotchIcon className="w-4 h-4 animate-spin" />
                    建立中...
                  </>
                ) : (
                  <>
                    <ShareNetworkIcon className="w-4 h-4" />
                    建立分享連結
                  </>
                )}
              </Button>
              {createFetcher.data && "error" in createFetcher.data && createFetcher.data.error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                  {createFetcher.data.error}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
