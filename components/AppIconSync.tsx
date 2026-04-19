"use client";

import { useEffect, useRef } from "react";
import { useTasbihStore } from "../store/tasbihStore";
import { isNativeApp } from "../lib/platform";
import { AppIconPlugin, resolveIconName } from "../lib/appIconPlugin";
import type { IconTheme } from "../store/tasbihStore";

export function AppIconSync() {
  const iconTheme = useTasbihStore((s) => s.preferences.iconTheme ?? "auto");
  const theme     = useTasbihStore((s) => s.preferences.theme);
  const lastRef   = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isNativeApp()) return;

    const name = resolveIconName(iconTheme as IconTheme, theme);
    // Skip if unchanged (also skips initial undefined → null on first render)
    if (name === lastRef.current) return;
    lastRef.current = name;

    void AppIconPlugin.setIcon({ name }).catch(() => {
      // Silently ignore — device may not support alternate icons
    });
  }, [iconTheme, theme]);

  return null;
}
