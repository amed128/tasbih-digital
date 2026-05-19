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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Why is Audio mode greyed out?", acceptedAnswer: { "@type": "Answer", text: "Audio mode requires an active list, not a single dhikr. Go to the Lists tab, select a list, then return to the counter." } },
      { "@type": "Question", name: "How do I create a custom list?", acceptedAnswer: { "@type": "Answer", text: "Go to the Lists tab → tap Create → give your list a name → add dhikrs from the library or create them manually." } },
      { "@type": "Question", name: "Are my counters and lists saved?", acceptedAnswer: { "@type": "Answer", text: "Yes, everything is saved automatically in your device's local storage. No account needed. You can export your data from Settings." } },
      { "@type": "Question", name: "What does the Reset on previous setting do?", acceptedAnswer: { "@type": "Answer", text: "In dhikr selection mode, when enabled, going back to a previous dhikr resets its counter to 0. When disabled, the counter resumes from where you left off." } },
      { "@type": "Question", name: "The auto-counter doesn't stop at my target. Why?", acceptedAnswer: { "@type": "Answer", text: "Enable the Stop at goal option in Settings → Auto-counter." } },
      { "@type": "Question", name: "Speech recognition doesn't understand me. What should I do?", acceptedAnswer: { "@type": "Answer", text: "Try switching to Tolerant mode in Settings → Audio-counter. Also make sure the recognition language matches your pronunciation (Saudi, Egyptian, Moroccan Arabic…)." } },
      { "@type": "Question", name: "How do I export or back up my data?", acceptedAnswer: { "@type": "Answer", text: "Go to Settings → Optional sync section → Generate a code, then Copy. You can paste this code on another device to restore your data." } },
      { "@type": "Question", name: "How do I reset my statistics?", acceptedAnswer: { "@type": "Answer", text: "Go to the Stats tab → scroll to the bottom → tap Reset statistics." } },
      { "@type": "Question", name: "What is Optional Sync?", acceptedAnswer: { "@type": "Answer", text: "It's a local backup tool — no server, no account. Tap Generate to create a code containing all your lists, dhikrs, and preferences, then Copy to put it in your clipboard. On another device, paste that code into the same field and tap Import to restore your data." } },
    ],
  };

  return (
    <div className="min-h-screen  text-[var(--foreground)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
