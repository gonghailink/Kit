import { useCallback, useEffect, useSyncExternalStore } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  type ThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
  applyThemeToDocument,
  getResolvedDark,
} from "~/lib/theme-mode";

// ---- tiny pub/sub for theme mode ----
let listeners: Array<() => void> = [];
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "system";
  return getStoredThemeMode();
}
function getServerSnapshot(): ThemeMode {
  return "system";
}

function setMode(mode: ThemeMode) {
  setStoredThemeMode(mode);
  applyThemeToDocument(mode);
  emitChange();
}

// ---- hook ----

export function useThemeMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = typeof window === "undefined" ? false : getResolvedDark(mode);

  // Mount 後立即套用主題 class
  useEffect(() => {
    applyThemeToDocument(getStoredThemeMode());
  }, []);

  // Listen to OS preference changes when in "system" mode
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredThemeMode() === "system") {
        applyThemeToDocument("system");
        emitChange();
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return { mode, isDark, setMode };
}

// ---- component ----

export function ThemeModeToggle() {
  const { mode, setMode } = useThemeMode();

  const icon =
    mode === "light" ? (
      <SunIcon className="w-4 h-4" />
    ) : mode === "dark" ? (
      <MoonIcon className="w-4 h-4" />
    ) : (
      <MonitorIcon className="w-4 h-4" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="px-3 py-1 rounded-full bg-transparent shadow-none"
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setMode("light")}
          className="cursor-pointer gap-2"
        >
          <SunIcon className="w-4 h-4" />
          淺色
          {mode === "light" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("dark")}
          className="cursor-pointer gap-2"
        >
          <MoonIcon className="w-4 h-4" />
          深色
          {mode === "dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("system")}
          className="cursor-pointer gap-2"
        >
          <MonitorIcon className="w-4 h-4" />
          跟隨系統
          {mode === "system" && (
            <span className="ml-auto text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
