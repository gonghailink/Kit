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
  theme_background?: string | null;
  theme_card?: string | null;
  theme_secondary?: string | null;
  theme_foreground?: string | null;
  theme_font?: string | null;
  theme_dark_primary?: string | null;
  theme_dark_background?: string | null;
  theme_dark_card?: string | null;
  theme_dark_secondary?: string | null;
  theme_dark_foreground?: string | null;
}

/**
 * 從 workspace 主題設定產生 CSS 變數 style 物件
 * 只回傳有設定的覆蓋值，未設定的欄位不會產生 CSS 變數（使用 globals.css 預設）
 */
export function generateThemeStyle(workspace: ThemeWorkspace | null | undefined, isDark = false): CSSProperties {
  if (!workspace) return {};

  // 根據 isDark 決定讀取哪組欄位
  const theme_primary = isDark ? workspace.theme_dark_primary : workspace.theme_primary;
  const theme_background = isDark ? workspace.theme_dark_background : workspace.theme_background;
  const theme_card = isDark ? workspace.theme_dark_card : workspace.theme_card;
  const theme_secondary = isDark ? workspace.theme_dark_secondary : workspace.theme_secondary;
  const theme_foreground = isDark ? workspace.theme_dark_foreground : workspace.theme_foreground;
  const theme_font = workspace.theme_font;

  // 沒有任何主題設定時直接回傳空物件（dark 模式由 globals.css .dark 預設色處理）
  if (!theme_primary && !theme_background && !theme_card && !theme_secondary && !theme_foreground && !theme_font) {
    return {};
  }

  const vars: Record<string, string> = {};

  // 主色
  if (theme_primary) {
    const hsl = hexToHsl(theme_primary);
    if (hsl) {
      vars["--primary"] = hsl;
      vars["--primary-foreground"] = contrastForeground(theme_primary);
      vars["--ring"] = hsl;
      vars["--accent"] = hsl;
      vars["--accent-foreground"] = contrastForeground(theme_primary);
    }
  }

  // 背景色
  if (theme_background) {
    const hsl = hexToHsl(theme_background);
    if (hsl) {
      vars["--background"] = hsl;
      // 衍生：border, input, muted 從背景色微調
      vars["--border"] = adjustHslLightness(hsl, -10);
      vars["--input"] = adjustHslLightness(hsl, -10);
      vars["--muted"] = adjustHslLightness(hsl, -8);
    }
  }

  // 資料夾顏色 (card)
  if (theme_card) {
    const hsl = hexToHsl(theme_card);
    if (hsl) {
      vars["--card"] = hsl;
      vars["--popover"] = hsl;
    }
  }

  // 書籤顏色 (secondary)
  if (theme_secondary) {
    const hsl = hexToHsl(theme_secondary);
    if (hsl) {
      vars["--secondary"] = hsl;
    }
  }

  // 文字顏色 (foreground)
  if (theme_foreground) {
    const hsl = hexToHsl(theme_foreground);
    if (hsl) {
      vars["--foreground"] = hsl;
      vars["--card-foreground"] = hsl;
      vars["--popover-foreground"] = hsl;
      vars["--secondary-foreground"] = hsl;
      // muted-foreground: 降低飽和度 + 調整亮度往中間靠
      vars["--muted-foreground"] = adjustHslSaturation(adjustHslLightness(hsl, 20), -10);
    }
  }

  // 轉換為 CSSProperties 格式
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    style[key] = value;
  }

  // 字體
  if (theme_font && FONT_MAP[theme_font]) {
    style["fontFamily"] = FONT_MAP[theme_font];
  }

  return style as CSSProperties;
}
