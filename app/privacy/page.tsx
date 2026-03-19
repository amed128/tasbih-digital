"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

export default function PrivacyPage() {
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
            href="/about"
            className="mb-1 text-sm text-[var(--primary)] font-medium"
          >
            {t("about.policyBack")}
          </Link>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("about.policyTitle")}
          </h1>
          <p className="text-xs text-[var(--secondary)]">{t("about.policyUpdated")}</p>
        </header>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs leading-relaxed text-[var(--secondary)]">
            {t("about.policyIntro")}
          </p>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.policyCollectionTitle")}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--secondary)]">
            {t("about.policyCollectionBody")}
          </p>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.policyStorageTitle")}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--secondary)]">
            {t("about.policyStorageBody")}
          </p>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.policyThirdPartyTitle")}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--secondary)]">
            {t("about.policyThirdPartyBody")}
          </p>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("about.policyControlTitle")}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--secondary)]">
            {t("about.policyControlBody")}
          </p>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {t("about.policyContactTitle")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--secondary)]">
              {t("about.policyContactBody")}
            </p>
          </div>
          <a
            href="https://github.com/amed128/tasbih-digital"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--primary)]"
          >
            GitHub ↗
          </a>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
