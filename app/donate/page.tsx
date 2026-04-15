"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";
import { useTasbihStore } from "../../store/tasbihStore";

const KOFI_URL = "https://ko-fi.com/attasbihapp";
const PAYPAL_URL = "https://paypal.me/YOUR_PAYPAL_USERNAME";
const LEMONSQUEEZY_URL = "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID";

function SuccessBanner() {
  const t = useT();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  if (!success) return null;
  return (
    <section className="rounded-2xl border border-[var(--success)] bg-[var(--card)] p-4 flex flex-col gap-1">
      <div className="text-sm font-semibold text-[var(--success)]">{t("donate.successTitle")}</div>
      <div className="text-xs text-[var(--secondary)]">{t("donate.success")}</div>
    </section>
  );
}

function StripeAmountPicker() {
  const t = useT();
  const [selected, setSelected] = useState<5 | 15 | 30>(5);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selected }),
      });
      if (res.status === 503) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {([5, 15, 30] as const).map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setSelected(amt)}
            className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
              selected === amt
                ? "border-[var(--primary)] bg-[var(--primary)] text-black"
                : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            }`}
          >
            {t(`donate.stripe${amt}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void handleCheckout()}
        disabled={loading}
        className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-black transition hover:brightness-95 active:brightness-90 disabled:opacity-50"
      >
        {loading ? "…" : t("donate.stripeCta")}
      </button>
    </div>
  );
}

type OptionProps = {
  label: string;
  hint: string;
  children: React.ReactNode;
};

function DonateOption({ label, hint, children }: OptionProps) {
  return (
    <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
        <div className="mt-0.5 text-xs text-[var(--secondary)]">{hint}</div>
      </div>
      {children}
    </section>
  );
}

export default function DonatePage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language);

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
            {t("donate.title")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">{t("donate.subtitle")}</p>
        </header>

        <Suspense>
          <SuccessBanner />
        </Suspense>

        <p className="text-xs text-[var(--secondary)] leading-relaxed px-1">
          {t("donate.impact")}
        </p>

        {/* Ko-fi */}
        <DonateOption label={t("donate.kofiLabel")} hint={t("donate.kofiHint")}>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-black transition hover:brightness-95 active:brightness-90 block"
          >
            {t("donate.kofiCta")}
          </a>
        </DonateOption>

        {/* PayPal */}
        <DonateOption label={t("donate.paypalLabel")} hint={t("donate.paypalHint")}>
          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-black transition hover:brightness-95 active:brightness-90 block"
          >
            {t("donate.paypalCta")}
          </a>
        </DonateOption>

        {/* Stripe */}
        <DonateOption label={t("donate.stripeLabel")} hint={t("donate.stripeHint")}>
          <StripeAmountPicker />
        </DonateOption>

        {/* Lemon Squeezy */}
        <DonateOption label={t("donate.lemonsqueezyLabel")} hint={t("donate.lemonsqueezyHint")}>
          <a
            href={LEMONSQUEEZY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-black transition hover:brightness-95 active:brightness-90 block"
          >
            {t("donate.lemonsqueezyCta")}
          </a>
        </DonateOption>

        <p className="text-center text-xs text-[var(--secondary)]">
          {language === "fr"
            ? "Jazak Allahu khayran pour votre soutien."
            : "Jazak Allahu khayran for your support."}
        </p>
      </motion.main>

      <BottomNav />
    </div>
  );
}
