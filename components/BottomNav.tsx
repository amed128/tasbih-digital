"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
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

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const tabs: Tab[] = [
    { href: "/", label: t("nav.counter") },
    { href: "/listes", label: t("nav.lists") },
    { href: "/stats", label: t("nav.stats") },
    { href: "/reglages", label: t("nav.settings") },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = getIcon(tab.href);
          const color = isActive ? "var(--primary)" : "var(--secondary)";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition"
            >
              <Icon size={22} style={{ color }} />
              <span style={{ color }}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
