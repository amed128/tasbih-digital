"use client";

import { useT } from "@/hooks/useT";
import GeneralSettings from "../../../components/GeneralSettings";
import { BottomNav } from "../../../components/BottomNav";

export default function GeneralSettingsPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-md flex-col gap-1 px-5 pb-32 pt-2">
        {/* Back button and breadcrumb (two lines, with gear icon) */}
        <div className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
          <a href="/reglages" className="hover:underline text-[var(--primary)] font-medium">← Back</a>
        </div>
        <div className="mb-2 flex items-center gap-2 text-xs text-[var(--secondary)]">
          <span>Settings</span>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold">General</span>
        </div>
        <h1 className="text-xl font-semibold mb-0.5">{t("settings.generalTitle")}</h1>
        <p className="text-sm text-[var(--secondary)] mb-2">
          {t("settings.generalHint")}
        </p>
        <GeneralSettings />
      </main>
      <BottomNav />
    </div>
  );
}
