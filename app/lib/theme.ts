import type { CSSProperties } from "react";

/**
 * 將 hex 色碼轉為 CSS 變數需要的 HSL 格式 "H S% L%"
 */
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 100%"; // 預設白色

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  // 相對亮度公式 (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0% 9.8%" : "0 0% 100%";
}

/**
 * 調整 HSL 亮度
 */
function adjustHslLightness(hsl: string, amount: number): string {
  const parts = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!parts) return hsl;

  const h = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  const l = Math.max(0, Math.min(100, parseFloat(parts[3]) + amount));
  return `${h} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

/**
 * 調整 HSL 飽和度
 */
function adjustHslSaturation(hsl: string, amount: number): string {
  const parts = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!parts) return hsl;

  const h = parseFloat(parts[1]);
  const s = Math.max(0, Math.min(100, parseFloat(parts[2]) + amount));
  const l = parseFloat(parts[3]);
  return `${h} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

/** 字體對照表 */
const FONT_MAP: Record<string, string> = {
  sans: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", "Helvetica Neue", Arial, sans-serif',
  serif: '"Noto Serif TC", "Songti TC", "SimSun", Georgia, serif',
  mono: '"JetBrains Mono", "Noto Sans TC", "Courier New", monospace',
};

export interface ThemeWorkspace {
  theme_primary?: string | null;
  theme_secondary?: string | null;
  theme_font?: string | null;
  theme_dark_primary?: string | null;
  theme_dark_secondary?: string | null;
}

/**
 * 從 workspace 主題設定產生 CSS 變數 style 物件
 * 只回傳有設定的覆蓋值，未設定的欄位不會產生 CSS 變數（使用 globals.css 預設）
 */
export function generateThemeStyle(workspace: ThemeWorkspace | null | undefined, isDark = false): CSSProperties {
  if (!workspace) return {};

  // 根據 isDark 決定讀取哪組欄位
  const theme_primary = isDark ? workspace.theme_dark_primary : workspace.theme_primary;
  const theme_secondary = isDark ? workspace.theme_dark_secondary : workspace.theme_secondary;

  // 如果沒有主色設定，直接回傳空物件
  if (!theme_primary) {
    return {};
  }

  const vars: Record<string, string> = {};

  // 主色
  const hsl = hexToHsl(theme_primary);
  const rgb = hexToRgb(theme_primary);
  if (hsl) {
    vars["--primary"] = hsl;
    vars["--primary-rgb"] = rgb; // 用於漸層
    vars["--primary-foreground"] = contrastForeground(theme_primary);
    vars["--ring"] = hsl;
    vars["--accent"] = hsl;
    vars["--accent-foreground"] = contrastForeground(theme_primary);
  }

  // 背景漸層：基礎色 + 主色漸層覆蓋
  const baseBackground = isDark ? "0 0% 15%" : "0 0% 100%"; // 深色：灰色，淺色：白色
  const gradient = `linear-gradient(to bottom, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0) 80%, rgba(${rgb}, 0.06) 85%, rgba(${rgb}, 0.10) 90%, rgba(${rgb}, 0.15) 95%, rgba(${rgb}, 0.2) 100%)`;
  vars["--background"] = baseBackground;
  vars["--background-color"] = baseBackground;
  vars["--background-gradient"] = gradient;

  // 文字顏色：全域字色依深色/淺色模式決定，避免主色過亮或過暗時整體文字失衡
  const defaultForeground = isDark ? "0 0% 98%" : "0 0% 3.9%";
  vars["--foreground"] = defaultForeground;
  vars["--card-foreground"] = defaultForeground;
  vars["--popover-foreground"] = defaultForeground;
  vars["--secondary-foreground"] = defaultForeground;
  vars["--muted-foreground"] = adjustHslSaturation(adjustHslLightness(defaultForeground, isDark ? -20 : 20), -10);

  // 衍生顏色：border, input, muted 從背景微調（但現在背景是漸層，所以用預設）
  // 這裡簡化，不設定這些，因為背景是漸層

  // 書籤顏色：如果設定了，使用設定值，否則預設白色
  if (theme_secondary) {
    const secondaryHsl = hexToHsl(theme_secondary);
    if (secondaryHsl) {
      vars["--secondary"] = secondaryHsl;
    }
  } else {
    // Tailwind expects raw HSL components in --secondary, not the full hsl() wrapper.
    vars["--secondary"] = "0 0% 100%"; // 預設白色
  }

  // 轉換為 CSSProperties 格式
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    style[key] = value;
  }

  // 同時把漸層設定成 root container 的背景圖，確保它能直接顯示
  style.backgroundImage = gradient;
  style.backgroundRepeat = "no-repeat";
  style.backgroundAttachment = "fixed";
  style.backgroundSize = "cover";

  // 字體（如果有設定）
  const theme_font = workspace.theme_font;
  if (theme_font && FONT_MAP[theme_font]) {
    style["fontFamily"] = FONT_MAP[theme_font];
  }

  return style as CSSProperties;
}
