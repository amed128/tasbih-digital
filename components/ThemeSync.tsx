"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";

const THEME_META_COLOR: Record<"light" | "dark" | "blue", string> = {
  light: "#F3F5F8",
  dark: "#0A0A0A",
  blue: "#0B1118",
};

export function ThemeSync() {
  const theme = useTasbihStore((s) => s.preferences.theme);
  const language = useTasbihStore((s) => s.preferences.language);

  useEffect(() => {
    const nextTheme = theme ?? "blue";
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body?.setAttribute("data-theme", nextTheme);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_META_COLOR[nextTheme]);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language ?? "fr";
  }, [language]);

  return null;
}
