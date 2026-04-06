"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";
import { useTasbihStore } from "@/store/tasbihStore";

const APP_VERSION = "0.2.1";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const MAX_CHARS = 500;
const MIN_CHARS = 20;
const RATE_LIMIT_KEY = "bug_report_last_submitted";
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

export default function SignalerBugPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language) ?? "fr";

  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  if (!mounted) return null;

  function isRateLimited(): boolean {
    const last = localStorage.getItem(RATE_LIMIT_KEY);
    if (!last) return false;
    return Date.now() - parseInt(last, 10) < RATE_LIMIT_MS;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < MIN_CHARS) {
      setStatus("error");
      setErrorMsg(t("about.bugForm.errorTooShort"));
      return;
    }
    if (isRateLimited()) {
      setStatus("error");
      setErrorMsg(t("about.bugForm.rateLimitError"));
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/bug-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          version: APP_VERSION,
          platform: Capacitor.getPlatform(),
          language,
        }),
      });

      const data = await res.json() as { ok: boolean; url?: string; error?: string };

      if (!data.ok) {
        setStatus("error");
        setErrorMsg(t("about.bugForm.errorGeneric"));
        return;
      }

      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
      setIssueUrl(data.url ?? "");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(t("about.bugForm.errorGeneric"));
    }
  }

  return (
    <motion.main
      className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pt-6 pb-28"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--secondary)]">
        <Link href="/reglages" className="hover:text-[var(--foreground)] transition-colors">
          {t("settings.title")}
        </Link>
        <span>›</span>
        <span className="text-[var(--foreground)]">{t("about.bugForm.title")}</span>
      </div>

      {status === "success" ? (
        <div className="rounded-2xl bg-[var(--card)] p-6 flex flex-col gap-3 items-center text-center">
          <div className="text-3xl">✅</div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{t("about.bugForm.successTitle")}</p>
          <p className="text-xs text-[var(--secondary)]">{t("about.bugForm.successBody")}</p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[var(--primary)]"
            >
              {t("about.bugForm.viewIssue")}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                {t("about.bugForm.title")}
              </label>
              <span className="text-xs text-[var(--secondary)]">
                {t("about.bugForm.counter", { count: String(description.length) })}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setDescription(e.target.value);
              }}
              placeholder={t("about.bugForm.placeholder")}
              rows={6}
              className="w-full resize-none rounded-xl bg-[var(--background)] p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {status === "error" && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "sending" || description.trim().length < MIN_CHARS}
            className="rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {status === "sending" ? t("about.bugForm.sending") : t("about.bugForm.submit")}
          </button>
        </form>
      )}

      <BottomNav />
    </motion.main>
  );
}
