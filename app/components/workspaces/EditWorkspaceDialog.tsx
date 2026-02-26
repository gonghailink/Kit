import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import { CircleNotch, ArrowCounterClockwise } from "@phosphor-icons/react";
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
import type { Workspace } from "~/lib/types";

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
}

type FetcherData =
  | { error: string; success?: never }
  | { success: true; error?: never };

/** 預設色值（對應 globals.css light mode） */
const DEFAULT_COLORS = {
  theme_primary: "#171717",
  theme_background: "#ffffff",
  theme_card: "#f2f2f2",
  theme_secondary: "#d9d9d9",
  theme_foreground: "#0a0a0a",
};

const COLOR_LABELS: Record<string, string> = {
  theme_primary: "主色",
  theme_background: "背景色",
  theme_card: "資料夾顏色",
  theme_secondary: "書籤顏色",
  theme_foreground: "文字顏色",
};

const FONT_OPTIONS = [
  { value: "sans", label: "無襯線", font: '"Noto Sans TC", sans-serif' },
  { value: "serif", label: "襯線", font: '"Noto Serif TC", serif' },
  { value: "mono", label: "等寬", font: '"JetBrains Mono", monospace' },
] as const;

type ThemeColorKey = keyof typeof DEFAULT_COLORS;

export default function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: EditWorkspaceDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const [colors, setColors] = useState<Record<ThemeColorKey, string>>({ ...DEFAULT_COLORS });
  const [font, setFont] = useState("sans");
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  // 當工作區改變時更新狀態
  useEffect(() => {
    if (workspace) {
      setTitle(workspace.title);
      setColors({
        theme_primary: workspace.theme_primary || DEFAULT_COLORS.theme_primary,
        theme_background: workspace.theme_background || DEFAULT_COLORS.theme_background,
        theme_card: workspace.theme_card || DEFAULT_COLORS.theme_card,
        theme_secondary: workspace.theme_secondary || DEFAULT_COLORS.theme_secondary,
        theme_foreground: workspace.theme_foreground || DEFAULT_COLORS.theme_foreground,
      });
      setFont(workspace.theme_font || "sans");
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

    // 比較是否與預設值相同，相同則傳空字串（清除自訂設定）
    const themeData: Record<string, string> = {};
    for (const key of Object.keys(DEFAULT_COLORS) as ThemeColorKey[]) {
      themeData[key] = colors[key] === DEFAULT_COLORS[key] ? "" : colors[key];
    }
    themeData.theme_font = font === "sans" ? "" : font;

    fetcher.submit(
      {
        intent: "update",
        id: workspace.id,
        title: title.trim(),
        ...themeData,
      },
      {
        method: "post",
        action: "/api/workspaces",
      }
    );
  };

  const resetColor = (key: ThemeColorKey) => {
    setColors((prev) => ({ ...prev, [key]: DEFAULT_COLORS[key] }));
  };

  const resetAll = () => {
    setColors({ ...DEFAULT_COLORS });
    setFont("sans");
  };

  if (!workspace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>編輯工作區</DialogTitle>
          <DialogDescription>
            修改工作區的名稱與主題設定
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            {/* 工作區名稱 */}
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

            {/* 顏色設定 */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>顏色主題</Label>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  全部重設
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(DEFAULT_COLORS) as ThemeColorKey[]).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <label
                      htmlFor={`color-${key}`}
                      className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-border flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <input
                        type="color"
                        id={`color-${key}`}
                        value={colors[key]}
                        onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                        disabled={isSubmitting}
                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer border-0"
                      />
                    </label>
                    <span className="text-sm flex-1">{COLOR_LABELS[key]}</span>
                    <span className="text-xs text-muted-foreground font-mono w-16">{colors[key]}</span>
                    <button
                      type="button"
                      onClick={() => resetColor(key)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="重設為預設值"
                    >
                      <ArrowCounterClockwise className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 字體設定 */}
            <div className="grid gap-2">
              <Label>字體風格</Label>
              <div className="flex gap-2">
                {FONT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFont(option.value)}
                    disabled={isSubmitting}
                    className={`flex-1 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      font === option.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                    style={{ fontFamily: option.font }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
