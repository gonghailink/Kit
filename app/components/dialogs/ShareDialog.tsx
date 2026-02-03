import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Loader2, Share2, Copy, Check, Trash2, ExternalLink, MonitorOffIcon } from "lucide-react";
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
    if (open) {
      loadFetcher.load(`/api/shares`);
    }
  }, [open]);

  // 建立成功後重新載入
  useEffect(() => {
    if (createFetcher.data && "success" in createFetcher.data && createFetcher.data.success && !isCreating) {
      loadFetcher.load(`/api/shares`);
    }
  }, [createFetcher.data, isCreating]);

  // 刪除成功後重新載入
  useEffect(() => {
    if (deleteFetcher.data && "success" in deleteFetcher.data && deleteFetcher.data.success && deleteFetcher.state === "idle") {
      loadFetcher.load(`/api/shares`);
    }
  }, [deleteFetcher.data, deleteFetcher.state]);

  const handleCreate = () => {
    const formData = new FormData();
    formData.append("intent", "create");
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
      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享我的書籤
          </DialogTitle>
          <DialogDescription className="pt-3">
            建立唯讀分享連結，讓其他人可以瀏覽您的所有書籤（不可編輯）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-hidden">
          {loadFetcher.state === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasShare ? (
            // 顯示現有分享連結
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">您的分享連結</h3>
              {shares.map((share) => {
                const shareUrl = share.short_link
                  ? `${window.location.origin}/s/${share.short_link}`
                  : `${window.location.origin}/share/${share.share_token}`;

                return (
                  <div
                    key={share.id}
                    className="rounded-lg p-6 space-y-3 bg-card/80"
                  >
                    <div className="min-w-0 space-y-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        建立於：{formatDate(share.created_at)}
                      </p>
                      <div className="bg-secondary/50 p-3 -mx-3 rounded min-w-0">
                        <p className="text-sm text-muted-foreground font-mono break-all">
                          {shareUrl}
                        </p>
                      </div>
                      {share.name && (
                        <p className="text-xs text-muted-foreground mt-2">
                          顯示名稱：{share.name}
                        </p>
                      )}
                      {share.short_link && (
                        <p className="text-xs text-muted-foreground mt-2">
                          短網址：/s/{share.short_link}
                        </p>
                      )}
                      {share.extra_btn_title && share.extra_btn_url && (
                        <p className="text-xs text-muted-foreground mt-2">
                          附加按鈕：{share.extra_btn_title} → {share.extra_btn_url}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleCopy(share)}
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
                        variant="destructive"
                        onClick={() => handleDelete(share.id)}
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
            <div className="px-2 space-y-4">
              <div className="text-center flex justify-center items-center gap-4 pb-4">
                <MonitorOffIcon className="w-16 h-16 text-background p-4 rounded-lg bg-primary/90" />
                <div className="text-left">
                  <p className="text-muted-foreground mb-2">
                    您尚未建立分享連結
                  </p>
                  <p className="text-sm text-muted-foreground">
                    建立後，任何人都可以透過連結瀏覽您的所有書籤
                  </p>
                </div>
              </div>

              <div className="bg-card/80 p-3 rounded-lg">
                <div className="space-y-2 ">
                  <label className="block text-sm font-medium">
                    顯示名稱（選填）
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：小明"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    將在分享頁面顯示為「XXX 的精選書籤」
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    自訂短網址（選填）
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/s/</span>
                    <input
                      type="text"
                      value={shortLink}
                      onChange={(e) => setShortLink(e.target.value)}
                      placeholder="例如：myBookmarks"
                      className="flex-1 px-3 py-2 border border-input rounded-lg bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={isCreating}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    留空則使用隨機產生的長網址。只能使用英數字、底線和連字號。
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    附加按鈕（選填）
                  </label>
                  <input
                    type="text"
                    value={extraBtnTitle}
                    onChange={(e) => setExtraBtnTitle(e.target.value)}
                    placeholder="按鈕文字，例如：聯絡我"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                  <input
                    type="url"
                    value={extraBtnUrl}
                    onChange={(e) => setExtraBtnUrl(e.target.value)}
                    placeholder="按鈕連結，例如：https://example.com"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background/70 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    在分享頁面右上角顯示自訂按鈕，兩個欄位都需填寫才會顯示。
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="gap-2 w-full"
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
              {createFetcher.data && "error" in createFetcher.data && createFetcher.data.error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                  {createFetcher.data.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
