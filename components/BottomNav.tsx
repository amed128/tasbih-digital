"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Hash, List, BarChart2, Settings } from "lucide-react";

type Tab = {
  href: string;
  label: string;
};

const tabs: Tab[] = [
  { href: "/", label: "Compteur" },
  { href: "/listes", label: "Listes" },
  { href: "/stats", label: "Stats" },
  { href: "/reglages", label: "Réglages" },
];

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

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = getIcon(tab.href);
          const color = isActive ? "#F5A623" : "#666666";

          return (
            <Link
              key={tab.href}
              href={tab.href}
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
