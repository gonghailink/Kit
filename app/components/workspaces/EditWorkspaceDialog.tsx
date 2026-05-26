import { useFetcher } from "react-router";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  ArrowCounterClockwise,
  CircleNotch,
  GradientIcon,
  ImageSquareIcon,
  PaintBrushIcon,
  PaletteIcon,
  SelectionBackgroundIcon,
  TextAaIcon,
} from "@phosphor-icons/react";
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

type TextColor = "black" | "white";
type BackgroundType = "solid" | "gradient" | "image";

interface ThemeFormState {
  theme_primary: string;
  theme_text_color: TextColor;
  theme_background_type: BackgroundType;
  theme_background_color: string;
  theme_background_gradient_from: string;
  theme_background_gradient_to: string;
  theme_background_image_url: string;
}

const DEFAULT_THEME: ThemeFormState = {
  theme_primary: "#171717",
  theme_text_color: "black",
  theme_background_type: "solid",
  theme_background_color: "#ffffff",
  theme_background_gradient_from: "#f8fafc",
  theme_background_gradient_to: "#dbeafe",
  theme_background_image_url: "",
};

const HEX_COLOR_RE = /^#?([0-9a-fA-F]{6})$/;

const FONT_OPTIONS = [
  { value: "sans", label: "無襯線", font: '"Noto Sans TC", sans-serif' },
  { value: "serif", label: "襯線", font: '"Noto Serif TC", serif' },
  { value: "mono", label: "等寬", font: '"JetBrains Mono", monospace' },
] as const;

const BACKGROUND_OPTIONS: Array<{
  value: BackgroundType;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
    { value: "solid", label: "單色", icon: PaintBrushIcon },
    { value: "gradient", label: "漸層", icon: GradientIcon },
    { value: "image", label: "圖片", icon: ImageSquareIcon },
  ];

function ColorControl({
  id,
  label,
  value,
  onChange,
  onReset,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="relative h-9 w-9 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-border shadow-sm transition-all hover:ring-2 hover:ring-primary/40"
      >
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute -left-2 -top-2 h-14 w-14 cursor-pointer border-0"
        />
      </label>
      <span className="flex-1 text-sm">{label}</span>
      <span className="w-16 font-mono text-xs text-muted-foreground">{value}</span>
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        title="重設"
      >
        <ArrowCounterClockwise className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  const result = value?.trim().match(HEX_COLOR_RE);
  return result ? `#${result[1].toLowerCase()}` : fallback;
}

function normalizeImageUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() || "";
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

export default function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: EditWorkspaceDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<ThemeFormState>({ ...DEFAULT_THEME });
  const [font, setFont] = useState("sans");
  const isSubmitting = fetcher.state === "submitting";
  const submitted = useRef(false);

  const updateTheme = <K extends keyof ThemeFormState>(key: K, value: ThemeFormState[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (workspace) {
      setTitle(workspace.title);
      setTheme({
        theme_primary: normalizeHexColor(workspace.theme_primary, DEFAULT_THEME.theme_primary),
        theme_text_color: workspace.theme_text_color === "white" ? "white" : "black",
        theme_background_type: (
          workspace.theme_background_type === "gradient" ||
          workspace.theme_background_type === "image"
        )
          ? workspace.theme_background_type
          : "solid",
        theme_background_color: normalizeHexColor(workspace.theme_background_color, DEFAULT_THEME.theme_background_color),
        theme_background_gradient_from: normalizeHexColor(workspace.theme_background_gradient_from, DEFAULT_THEME.theme_background_gradient_from),
        theme_background_gradient_to: normalizeHexColor(workspace.theme_background_gradient_to, DEFAULT_THEME.theme_background_gradient_to),
        theme_background_image_url: normalizeImageUrl(workspace.theme_background_image_url),
      });
      setFont(workspace.theme_font || "sans");
    }
  }, [workspace]);

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

    const backgroundImageUrl = theme.theme_background_image_url.trim();
    const hasCustomBackground =
      theme.theme_background_type === "image"
        ? backgroundImageUrl !== ""
        : theme.theme_background_type === "gradient" ||
        theme.theme_background_color !== DEFAULT_THEME.theme_background_color;

    fetcher.submit(
      {
        intent: "update",
        id: workspace.id,
        title: title.trim(),
        theme_primary: theme.theme_primary === DEFAULT_THEME.theme_primary ? "" : theme.theme_primary,
        theme_text_color: theme.theme_text_color === DEFAULT_THEME.theme_text_color ? "" : theme.theme_text_color,
        theme_background_type: hasCustomBackground ? theme.theme_background_type : "",
        theme_background_color: hasCustomBackground && theme.theme_background_type === "solid" ? theme.theme_background_color : "",
        theme_background_gradient_from: hasCustomBackground && theme.theme_background_type === "gradient" ? theme.theme_background_gradient_from : "",
        theme_background_gradient_to: hasCustomBackground && theme.theme_background_type === "gradient" ? theme.theme_background_gradient_to : "",
        theme_background_image_url: hasCustomBackground && theme.theme_background_type === "image" ? backgroundImageUrl : "",
        theme_font: font === "sans" ? "" : font,
      },
      {
        method: "post",
        action: "/api/workspaces",
      }
    );
  };

  const resetTheme = () => {
    setTheme({ ...DEFAULT_THEME });
  };

  if (!workspace) return null;

  const backgroundImagePreview = theme.theme_background_image_url.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>編輯工作區</DialogTitle>
          <DialogDescription>修改工作區的名稱與主題設定</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
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

            <section className="grid gap-4 rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-1.5">
                  <PaletteIcon className="h-4 w-4" />
                  主題設定
                </Label>
                <button
                  type="button"
                  onClick={resetTheme}
                  disabled={isSubmitting}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                >
                  重設主題
                </button>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <TextAaIcon className="h-4 w-4" />
                    文字色彩
                  </Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={theme.theme_text_color === "white"}
                    onClick={() => updateTheme("theme_text_color", theme.theme_text_color === "white" ? "black" : "white")}
                    disabled={isSubmitting}
                    className="relative h-9 w-24 rounded-full border border-border bg-secondary p-1 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <span
                      className={`absolute top-1 h-7 w-10 rounded-full bg-background shadow-sm transition-transform ${theme.theme_text_color === "white" ? "translate-x-11" : "translate-x-0"
                        }`}
                    />
                    <span className="relative z-10 grid h-full grid-cols-2 items-center">
                      <span className={theme.theme_text_color === "black" ? "text-foreground" : "text-muted-foreground"}>
                        黑
                      </span>
                      <span className={theme.theme_text_color === "white" ? "text-foreground" : "text-muted-foreground"}>
                        白
                      </span>
                    </span>
                  </button>
                </div>

                <ColorControl
                  id="theme-primary"
                  label="主題色"
                  value={theme.theme_primary}
                  onChange={(value) => updateTheme("theme_primary", value)}
                  onReset={() => updateTheme("theme_primary", DEFAULT_THEME.theme_primary)}
                  disabled={isSubmitting}
                />
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border border-border/70 p-4">
              <Label className="flex items-center gap-1.5">
                <SelectionBackgroundIcon className="h-4 w-4" />
                背景設定
              </Label>

              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme.theme_background_type === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateTheme("theme_background_type", option.value)}
                      disabled={isSubmitting}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all disabled:opacity-50 ${isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {theme.theme_background_type === "solid" && (
                <ColorControl
                  id="theme-background-color"
                  label="背景色"
                  value={theme.theme_background_color}
                  onChange={(value) => updateTheme("theme_background_color", value)}
                  onReset={() => updateTheme("theme_background_color", DEFAULT_THEME.theme_background_color)}
                  disabled={isSubmitting}
                />
              )}

              {theme.theme_background_type === "gradient" && (
                <div className="grid gap-3">
                  <ColorControl
                    id="theme-background-gradient-from"
                    label="起始色"
                    value={theme.theme_background_gradient_from}
                    onChange={(value) => updateTheme("theme_background_gradient_from", value)}
                    onReset={() => updateTheme("theme_background_gradient_from", DEFAULT_THEME.theme_background_gradient_from)}
                    disabled={isSubmitting}
                  />
                  <ColorControl
                    id="theme-background-gradient-to"
                    label="結束色"
                    value={theme.theme_background_gradient_to}
                    onChange={(value) => updateTheme("theme_background_gradient_to", value)}
                    onReset={() => updateTheme("theme_background_gradient_to", DEFAULT_THEME.theme_background_gradient_to)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {theme.theme_background_type === "image" && (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="theme-background-image-url" className="text-sm">
                      圖片網址
                    </Label>
                    <Input
                      id="theme-background-image-url"
                      type="url"
                      placeholder="https://example.com/background.jpg"
                      value={theme.theme_background_image_url}
                      onChange={(e) => updateTheme("theme_background_image_url", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {backgroundImagePreview && (
                    <div
                      className="h-20 rounded-lg border border-border bg-cover bg-center"
                      style={{ backgroundImage: `url("${backgroundImagePreview.replace(/"/g, "%22")}")` }}
                    />
                  )}
                </div>
              )}
            </section>

            <div className="grid gap-2">
              <Label>字體風格</Label>
              <div className="flex gap-2">
                {FONT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFont(option.value)}
                    disabled={isSubmitting}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition-all ${font === option.value
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
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
