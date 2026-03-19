"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

export default function AboutPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const t = useT();

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
          <Link
            href="/reglages"
            className="mb-1 text-sm text-[var(--primary)] font-medium"
          >
            {t("about.back")}
          </Link>
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
