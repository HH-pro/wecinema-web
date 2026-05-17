"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Mode | null;
    const initial: Mode =
      saved ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setModeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
    document.documentElement.setAttribute("data-theme", m);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

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
