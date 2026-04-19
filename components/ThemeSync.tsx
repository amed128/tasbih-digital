"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

const THEME_META_COLOR: Record<"light" | "dark" | "blue" | "emerald", string> = {
  light: "#F3F5F8",
  dark: "#0A0A0A",
  blue: "#0B1118",
  emerald: "#04291E",
};

export function ThemeSync() {
  const theme = useTasbihStore((s) => s.preferences.theme);
  const iconTheme = useTasbihStore((s) => s.preferences.iconTheme);
  const language = useTasbihStore((s) => s.preferences.language);

  useEffect(() => {
    const nextTheme = theme ?? "blue";
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body?.setAttribute("data-theme", nextTheme);

    const color = THEME_META_COLOR[nextTheme];
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", color);
    }

    // Sync native iOS status bar color and style with the current theme
    StatusBar.setBackgroundColor({ color }).catch(() => {});
    StatusBar.setStyle({
      style: nextTheme === "light" ? Style.Light : Style.Dark,
    }).catch(() => {});
  }, [theme]);

  // Dynamically swap favicon and apple-touch-icon based on iconTheme preference
  useEffect(() => {
    const appTheme = theme ?? "blue";
    const effective = (!iconTheme || iconTheme === "auto") ? appTheme : iconTheme;
    const href = `/icon-192-${effective}.png`;

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-app-icon]');
    if (favicon) favicon.href = href;

    const touchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"][data-app-icon]');
    if (touchIcon) touchIcon.href = href;
  }, [theme, iconTheme]);

  useEffect(() => {
    document.documentElement.lang = language ?? "fr";
  }, [language]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add("is-native-ios");
    } else {
      document.body.classList.add("is-pwa");
    }
  }, []);

  return null;
}
