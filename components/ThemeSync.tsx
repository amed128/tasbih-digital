"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

const THEME_META_COLOR: Record<"light" | "dark" | "blue" | "emerald" | "obsidian" | "midnight", string> = {
  light: "#F3F5F8",
  dark: "#0A0A0A",
  blue: "#0B1118",
  emerald: "#04291E",
  obsidian: "#0D0D10",
  midnight: "#071020",
};

export function ThemeSync() {
  const theme = useTasbihStore((s) => s.preferences.theme);
  const iconTheme = useTasbihStore((s) => s.preferences.iconTheme);
  const language = useTasbihStore((s) => s.preferences.language);

  // On mount: set the native status bar background color to match the theme.
  // Non-overlay mode (the capacitor.config.json default) lets iOS handle safe
  // area automatically — the web view starts below the Dynamic Island/notch.
  useEffect(() => {
    if (Capacitor.getPlatform() !== "ios") return;
    const initialTheme = (theme ?? "blue") as keyof typeof THEME_META_COLOR;
    StatusBar.setBackgroundColor({ color: THEME_META_COLOR[initialTheme] }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextTheme = theme ?? "blue";
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body?.setAttribute("data-theme", nextTheme);

    const color = THEME_META_COLOR[nextTheme];
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", color);
    }

    // Double-RAF: effects fire before the browser paints; two frames push the
    // Capacitor calls to after the new CSS (and the safe-area strip) have been
    // composited so any iOS snapshot reads the correct pixels.
    let id2: ReturnType<typeof requestAnimationFrame>;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        if (Capacitor.getPlatform() === "ios") {
          StatusBar.setBackgroundColor({ color: THEME_META_COLOR[nextTheme] }).catch(() => {});
        }
        StatusBar.setStyle({
          style: nextTheme === "light" ? Style.Light : Style.Dark,
        }).catch(() => {});
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
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
    document.documentElement.dir = (language === "ar" || language === "ur" || language === "fa") ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      document.body.classList.add("is-native-ios");
    } else if (!Capacitor.isNativePlatform()) {
      document.body.classList.add("is-pwa");
    }
  }, []);

  return null;
}
