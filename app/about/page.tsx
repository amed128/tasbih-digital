"use client";

import { useSyncExternalStore } from "react";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";
import { useFeatureAvailability } from "@/hooks/useFeatureAvailability";
import type { FeatureStatus } from "@/lib/featureAvailability";

export default function AboutPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const t = useT();
  const vibrationAvail = useFeatureAvailability("vibration");
  const wakeLockAvail = useFeatureAvailability("wakeLock");
  const notificationsAvail = useFeatureAvailability("notifications");

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <motion.main
        className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex flex-col gap-1">
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <Link href="/reglages" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <Settings className="inline-block w-4 h-4 mr-1" />
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("about.title")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("about.title")}
          </h1>
        </header>

        {/* App info */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.appSectionTitle")}
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            {t("about.appDescription")}
          </div>
          <div className="text-xs text-[var(--secondary)]">{t("about.version")}</div>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.dataSectionTitle")}
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            {t("about.dataDescription")}
          </div>
        </section>

        <Link
          href="/privacy"
          className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("about.privacyPolicy")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("about.privacyPolicyHint")}
            </div>
          </div>
          <span className="text-[var(--secondary)] text-base">›</span>
        </Link>

        {/* Local storage */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.storageSectionTitle")}
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            {t("about.storageDescription")}
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t("settings.deviceSupportTitle")}</div>
          <div className="flex flex-col gap-3">
            {([
              { key: "vibration", labelKey: "settings.featureVibration", avail: vibrationAvail },
              { key: "wakeLock", labelKey: "settings.featureWakeLock", avail: wakeLockAvail },
              { key: "notifications", labelKey: "settings.featureNotifications", avail: notificationsAvail },
            ] as { key: string; labelKey: string; avail: { status: FeatureStatus } }[]).map(({ key, labelKey, avail }) => {
              const badgeStyles: Record<FeatureStatus, string> = {
                available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                limited: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500",
                "permission-required": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
                unsupported: "opacity-50 bg-[var(--background)] text-[var(--secondary)] border border-[var(--border)]",
              };
              const statusLabelKey: Record<FeatureStatus, string> = {
                available: "settings.statusAvailable",
                limited: "settings.statusLimited",
                "permission-required": "settings.statusPermissionRequired",
                unsupported: "settings.statusUnsupported",
              };
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground)]">{t(labelKey)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[avail.status]}`}>
                    {t(statusLabelKey[avail.status])}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Source */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.sourceTitle")}
          </div>
          <a
            href="https://github.com/amed128/tasbih-digital"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--primary)]"
          >
            {t("about.sourceHint")} ↗
          </a>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
