"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Mode = "light" | "dark";

interface ThemeCtx {
  mode: Mode;
  isDark: boolean;
  setMode: (m: Mode) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "wc_theme";
const THEME_EVENT = "wc-theme-change";

function applyTheme(m: Mode) {
  const el = document.documentElement;
  el.setAttribute("data-theme", m);
  el.style.colorScheme = m;
}

// `data-theme` is the single source of truth for the visual theme. It's set
// before first paint by the inline script in app/layout.tsx, and updated by
// setMode() here. We subscribe to it via useSyncExternalStore so React state
// stays in sync without a setState-in-effect and without a hydration mismatch.
function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback); // sync across tabs
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getClientSnapshot(): Mode {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

// Server (and the first hydration render) always reports "light" to match the
// SSR markup; useSyncExternalStore then swaps in the real client value with no
// mismatch warning. The colors are already correct via the pre-paint script, so
// there is no visible flash.
function getServerSnapshot(): Mode {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setMode = useCallback((m: Mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // localStorage unavailable (private mode / blocked) — theme still applies
      // for this session, it just won't persist.
    }
    applyTheme(m);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(getClientSnapshot() === "dark" ? "light" : "dark");
  }, [setMode]);

  return (
    <Ctx.Provider value={{ mode, isDark: mode === "dark", setMode, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
