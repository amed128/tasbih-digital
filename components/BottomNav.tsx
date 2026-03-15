"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#1A1A1A] text-[#F5A623]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="text-base">•</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
