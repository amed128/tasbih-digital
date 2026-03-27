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
          <span className="inline-block align-middle mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block"><path fillRule="evenodd" d="M11.983 1.705a1.75 1.75 0 0 0-3.966 0l-.106.374a2.25 2.25 0 0 1-3.063 1.418l-.36-.153a1.75 1.75 0 0 0-2.287 2.287l.153.36a2.25 2.25 0 0 1-1.418 3.063l-.374.106a1.75 1.75 0 0 0 0 3.966l.374.106a2.25 2.25 0 0 1 1.418 3.063l-.153.36a1.75 1.75 0 0 0 2.287 2.287l.36-.153a2.25 2.25 0 0 1 3.063 1.418l.106.374a1.75 1.75 0 0 0 3.966 0l.106-.374a2.25 2.25 0 0 1 3.063-1.418l.36.153a1.75 1.75 0 0 0 2.287-2.287l-.153-.36a2.25 2.25 0 0 1 1.418-3.063l.374-.106a1.75 1.75 0 0 0 0-3.966l-.374-.106a2.25 2.25 0 0 1-1.418-3.063l.153-.36a1.75 1.75 0 0 0-2.287-2.287l-.36.153a2.25 2.25 0 0 1-3.063-1.418l-.106-.374ZM10 13.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5Z" clipRule="evenodd" /></svg>
          </span>
          <span>Settings</span>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold">General</span>
        </div>
        <h1 className="text-xl font-semibold mb-0.5">{t("settings.generalTitle", "General Settings")}</h1>
        <p className="text-sm text-[var(--secondary)] mb-2">
          {t(
            "settings.generalHint",
            "Manage sound, vibration, language, and screen settings."
          )}
        </p>
        <GeneralSettings />
      </main>
      <BottomNav />
    </div>
  );
}
