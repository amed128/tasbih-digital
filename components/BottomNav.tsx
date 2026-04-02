"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { Hash, List, BarChart2, Settings } from "lucide-react";
import { useT } from "@/hooks/useT";

type Tab = {
  href: string;
  label: string;
};

function getIcon(href: string) {
  switch (href) {
    case "/":
      return Hash;
    case "/listes":
      return List;
    case "/stats":
      return BarChart2;
    case "/reglages":
      return Settings;
    default:
      return Hash;
  }
}

const SETTINGS_ROOT = "/reglages";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const lastSettingsPath = useRef<string>(SETTINGS_ROOT);

  // Track last visited settings path whenever user is inside settings
  useEffect(() => {
    if (pathname.startsWith(SETTINGS_ROOT)) {
      lastSettingsPath.current = pathname;
    }
  }, [pathname]);

  const tabs: Tab[] = [
    { href: "/", label: t("nav.counter") },
    { href: "/listes", label: t("nav.lists") },
    { href: "/stats", label: t("nav.stats") },
    { href: SETTINGS_ROOT, label: t("nav.settings") },
  ];

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isInsideSettings = pathname.startsWith(SETTINGS_ROOT);
    if (isInsideSettings) {
      // Already in a subpage → go to root settings
      router.push(SETTINGS_ROOT);
    } else {
      // Coming from another tab → restore last settings location
      router.push(lastSettingsPath.current);
    }
  };

  return (
    <nav role="navigation" aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href === "/" ? tab.href : tab.href) &&
            (tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href));
          const Icon = getIcon(tab.href);
          const color = isActive ? "var(--primary)" : "var(--secondary)";

          if (tab.href === SETTINGS_ROOT) {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={handleSettingsClick}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition hover:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
              >
                <Icon size={22} style={{ color }} />
                <span style={{ color }}>{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition hover:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
            >
              <Icon size={22} style={{ color }} />
              <span style={{ color }}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
