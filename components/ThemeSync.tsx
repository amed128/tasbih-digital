"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

const THEME_META_COLOR: Record<"light" | "dark" | "blue" | "emerald" | "obsidian", string> = {
  light: "#F3F5F8",
  dark: "#0A0A0A",
  blue: "#0B1118",
  emerald: "#04291E",
  obsidian: "#0D0D10",
};

export function ThemeSync() {
  const theme = useTasbihStore((s) => s.preferences.theme);
  const iconTheme = useTasbihStore((s) => s.preferences.iconTheme);
  const language = useTasbihStore((s) => s.preferences.language);

  // On mount: ensure the status bar overlays the web view so the body background
  // is always the source of truth for the visible bar color. setBackgroundColor
  // on iOS can silently switch the bar to non-overlay (opaque) mode, which then
  // persists across theme changes — so we never call it.
  useEffect(() => {
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
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

    // Double-RAF: useEffect fires before the browser composites its next frame.
    // Two animation frames guarantee the new CSS (including deco-opacity → 0) has
    // been painted before we tell the native bar to re-read the web-view pixels.
    // Without this the bar can latch a stale GPU-blurred texture from a previous
    // premium-theme decoration and keep showing the old color.
    let id1: ReturnType<typeof requestAnimationFrame>;
    let id2: ReturnType<typeof requestAnimationFrame>;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
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
