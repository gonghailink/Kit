export const THEME_STORAGE_KEY = "bk-theme-mode";

export type ThemeMode = "light" | "dark" | "system";

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function setStoredThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function getResolvedDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeToDocument(mode: ThemeMode): void {
  const isDark = getResolvedDark(mode);
  document.documentElement.classList.toggle("dark", isDark);
}
