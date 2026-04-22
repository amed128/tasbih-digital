"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

type FaqItem = { q: string; a: string };

function FaqEntry({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold text-[var(--foreground)]"
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          className="shrink-0 text-[var(--secondary)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <p className="pb-3 text-xs leading-relaxed text-[var(--secondary)]">{a}</p>
      )}
    </div>
  );
}

export default function AidePage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const t = useT();

  if (!mounted) return null;

  const modes = [
    {
      title: t("help.modeIncrement"),
      desc: t("help.modeIncrementDesc"),
      tip: t("help.modeIncrementTip"),
    },
    {
      title: t("help.modeDecrement"),
      desc: t("help.modeDecrementDesc"),
      tip: t("help.modeDecrementTip"),
    },
    {
      title: t("help.modeAuto"),
      desc: t("help.modeAutoDesc"),
      tip: t("help.modeAutoTip"),
    },
    {
      title: t("help.modeAudio"),
      desc: t("help.modeAudioDesc"),
      tip: t("help.modeAudioTip"),
    },
  ];

  const faqs: FaqItem[] = [
    { q: t("help.faq1Q"), a: t("help.faq1A") },
    { q: t("help.faq2Q"), a: t("help.faq2A") },
    { q: t("help.faq3Q"), a: t("help.faq3A") },
    { q: t("help.faq4Q"), a: t("help.faq4A") },
    { q: t("help.faq5Q"), a: t("help.faq5A") },
    { q: t("help.faq6Q"), a: t("help.faq6A") },
    { q: t("help.faq7Q"), a: t("help.faq7A") },
    { q: t("help.faq8Q"), a: t("help.faq8A") },
    { q: t("help.faq9Q"), a: t("help.faq9A") },
  ];

  return (
    <div className="min-h-screen  text-[var(--foreground)]">
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
            <span className="text-[var(--foreground)]">{t("help.title")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("help.title")}</h1>
        </header>

        {/* Intro */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("help.subtitle")}</div>
          <p className="text-xs leading-relaxed text-[var(--secondary)]">{t("help.intro")}</p>
        </section>

        {/* Modes */}
        <section className="flex flex-col gap-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
            {t("help.modesTitle")}
          </div>
          {modes.map((m) => (
            <div key={m.title} className="rounded-2xl bg-[var(--card)] px-4 py-3 flex flex-col gap-1">
              <div className="text-sm font-semibold text-[var(--foreground)]">{m.title}</div>
              <div className="text-xs text-[var(--secondary)]">{m.desc}</div>
              <div className="text-xs text-[var(--primary)] font-medium">{m.tip}</div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
            {t("help.faqTitle")}
          </div>
          <div className="rounded-2xl bg-[var(--card)] px-4">
            {faqs.map((item) => (
              <FaqEntry key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
