"use client";

import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

export default function DonatePage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const t = useT();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

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
            <Link href="/reglages" className="hover:text-[var(--foreground)]">
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.supportTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("donate.title")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">{t("donate.subtitle")}</p>
        </header>

        {success ? (
          <section className="rounded-2xl border border-[var(--success)] bg-[var(--card)] p-4 flex flex-col gap-1">
            <div className="text-sm font-semibold text-[var(--success)]">{t("donate.successTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("donate.success")}</div>
          </section>
        ) : null}

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-3">
          <p className="text-xs text-[var(--secondary)] leading-relaxed">
            {t("donate.impact")}
          </p>
          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-black transition hover:brightness-95 active:brightness-90"
          >
            Ko-fi ↗
          </a>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
