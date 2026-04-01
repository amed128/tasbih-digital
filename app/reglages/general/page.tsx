"use client";

import { useT } from "@/hooks/useT";
import GeneralSettings from "../../../components/GeneralSettings";
import { BottomNav } from "../../../components/BottomNav";

export default function GeneralSettingsPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6">
        <header className="flex flex-col gap-1">
          <a href="/reglages" className="mb-1 text-sm font-medium text-[var(--primary)]">{t("about.back")}</a>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <a href="/reglages" className="hover:text-[var(--foreground)]">{t("settings.title")}</a>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.generalTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("settings.generalTitle")}</h1>
          <p className="text-sm text-[var(--secondary)]">{t("settings.generalHint")}</p>
        </header>
        <GeneralSettings />
      </main>
      <BottomNav />
    </div>
  );
}
