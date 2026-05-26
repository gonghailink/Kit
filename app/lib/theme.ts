import type { CSSProperties } from "react";

const HEX_COLOR_RE = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

/**
 * 將 hex 色碼轉為 CSS 變數需要的 HSL 格式 "H S% L%"
 */
export function hexToHsl(hex: string): string {
  const result = HEX_COLOR_RE.exec(hex);
  if (!result) return "";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

/**
 * 將 hex 色碼轉為 RGB 格式 "R, G, B"
 */
export function hexToRgb(hex: string): string {
  const result = HEX_COLOR_RE.exec(hex);
  if (!result) return "0, 0, 0";

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * 根據亮度決定文字應該是黑色還是白色
 */
function contrastForeground(hex: string): string {
  const result = HEX_COLOR_RE.exec(hex);
  if (!result) return "0 0% 100%";

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0% 9.8%" : "0 0% 100%";
}

/** 字體對照表 */
const FONT_MAP: Record<string, string> = {
  sans: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", "Helvetica Neue", Arial, sans-serif',
  serif: '"Noto Serif TC", "Songti TC", "SimSun", Georgia, serif',
  mono: '"JetBrains Mono", "Noto Sans TC", "Courier New", monospace',
};

export interface ThemeWorkspace {
  theme_primary?: string | null;
  theme_font?: string | null;
  theme_text_color?: string | null;
  theme_background_type?: string | null;
  theme_background_color?: string | null;
  theme_background_gradient_from?: string | null;
  theme_background_gradient_to?: string | null;
  theme_background_image_url?: string | null;
}

function isHexColor(value: string | null | undefined): value is string {
  return !!value && HEX_COLOR_RE.test(value);
}

function escapeCssUrl(value: string): string {
  return value.trim().replace(/["\\\n\r]/g, "");
}

/**
 * 從 workspace 主題設定產生 CSS 變數 style 物件。
 * 新版主題不分深色/淺色模式，所有視覺設定都來自同一組 workspace 欄位。
 */
export function generateThemeStyle(workspace: ThemeWorkspace | null | undefined): CSSProperties {
  if (!workspace) return {};

  const vars: Record<string, string> = {};
  const style: Record<string, string> = {};
  const wantsWhiteText = workspace.theme_text_color === "white";

  if (isHexColor(workspace.theme_primary)) {
    const hsl = hexToHsl(workspace.theme_primary);
    const rgb = hexToRgb(workspace.theme_primary);
    vars["--primary"] = hsl;
    vars["--primary-rgb"] = rgb;
    vars["--primary-foreground"] = contrastForeground(workspace.theme_primary);
    vars["--ring"] = hsl;
    vars["--accent"] = hsl;
    vars["--accent-foreground"] = contrastForeground(workspace.theme_primary);
    vars["--bookmark-card-hover-border"] = `rgba(${rgb}, 0.72)`;
  }

  if (workspace.theme_text_color === "black" || workspace.theme_text_color === "white") {
    const foreground = wantsWhiteText ? "0 0% 98%" : "0 0% 3.9%";
    vars["--foreground"] = foreground;
    vars["--card-foreground"] = foreground;
    vars["--popover-foreground"] = foreground;
    vars["--secondary-foreground"] = foreground;
    vars["--muted-foreground"] = wantsWhiteText ? "0 0% 76%" : "0 0% 45.1%";

    vars["--card"] = wantsWhiteText ? "0 0% 9%" : "0 0% 97%";
    vars["--popover"] = wantsWhiteText ? "0 0% 9%" : "0 0% 100%";
    vars["--secondary"] = wantsWhiteText ? "0 0% 15%" : "0 0% 90%";
    vars["--muted"] = wantsWhiteText ? "0 0% 15%" : "0 0% 96.1%";
    vars["--border"] = wantsWhiteText ? "0 0% 22%" : "0 0% 89.8%";
    vars["--input"] = wantsWhiteText ? "0 0% 22%" : "0 0% 89.8%";

    vars["--bookmark-card-bg"] = wantsWhiteText
      ? "rgba(12, 15, 23, 0.46)"
      : "rgba(255, 255, 255, 0.62)";
    vars["--bookmark-card-hover-bg"] = wantsWhiteText
      ? "rgba(12, 15, 23, 0.58)"
      : "rgba(255, 255, 255, 0.78)";
    vars["--bookmark-card-border"] = wantsWhiteText
      ? "rgba(255, 255, 255, 0.16)"
      : "rgba(15, 23, 42, 0.1)";
    vars["--bookmark-card-shadow"] = wantsWhiteText
      ? "0 20px 70px rgba(0, 0, 0, 0.28)"
      : "0 18px 60px rgba(15, 23, 42, 0.08)";
  }

  if (workspace.theme_background_type === "solid" && isHexColor(workspace.theme_background_color)) {
    vars["--background"] = hexToHsl(workspace.theme_background_color);
    style.backgroundColor = workspace.theme_background_color;
    style.backgroundImage = "none";
  }

  if (
    workspace.theme_background_type === "gradient" &&
    isHexColor(workspace.theme_background_gradient_from) &&
    isHexColor(workspace.theme_background_gradient_to)
  ) {
    vars["--background"] = hexToHsl(workspace.theme_background_gradient_from);
    style.backgroundColor = workspace.theme_background_gradient_from;
    style.backgroundImage = `linear-gradient(135deg, ${workspace.theme_background_gradient_from} 0%, ${workspace.theme_background_gradient_to} 100%)`;
  }

  if (workspace.theme_background_type === "image" && workspace.theme_background_image_url) {
    const fallback = wantsWhiteText ? "#111827" : "#ffffff";
    const overlay = wantsWhiteText
      ? "linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28))"
      : "linear-gradient(rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.18))";

    vars["--background"] = hexToHsl(fallback);
    style.backgroundColor = fallback;
    style.backgroundImage = `${overlay}, url("${escapeCssUrl(workspace.theme_background_image_url)}")`;
  }

  for (const [key, value] of Object.entries(vars)) {
    style[key] = value;
  }

  if (style.backgroundImage) {
    style.backgroundRepeat = "no-repeat";
    style.backgroundAttachment = "fixed";
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }

  const theme_font = workspace.theme_font;
  if (theme_font && FONT_MAP[theme_font]) {
    style.fontFamily = FONT_MAP[theme_font];
  }

  return style as CSSProperties;
}
