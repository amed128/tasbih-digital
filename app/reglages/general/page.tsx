"use client";

import { useT } from "@/hooks/useT";
import GeneralSettings from "../../../components/GeneralSettings";
import { BottomNav } from "../../../components/BottomNav";
import { SettingsHeader } from "../../../components/SettingsHeader";

export default function GeneralSettingsPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6">
        <SettingsHeader
          backLabel={t("about.back")}
          backHref="/reglages"
          parentLabel={t("settings.title")}
          parentHref="/reglages"
          title={t("settings.generalTitle")}
          subtitle={t("settings.generalHint")}
        />
        <GeneralSettings />
      </main>
      <BottomNav />
    </div>
  );
}
