"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTasbihStore } from "../../store/tasbihStore";
import { zikrs } from "../../data/zikrs";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

function dayLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { weekday: "short" });
}

function buildLast7DaysZikrData(history: { startAt: string; zikrCount: number }[], locale: string) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const data: { day: string; date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    data.push({ day: dayLabel(d, locale), date: key, total: 0 });
  }

  history.forEach((entry) => {
    const key = entry.startAt.slice(0, 10);
    const row = data.find((r) => r.date === key);
    if (row) row.total += entry.zikrCount;
  });

  return data;
}

function computeStreak(dates: string[]) {
  const unique = Array.from(new Set(dates)).sort((a, b) => (a < b ? 1 : -1));
  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  for (let i = 0; i < unique.length; i += 1) {
    const day = new Date(unique[i]);
    if (Number.isNaN(day.getTime())) continue;
    if (day.getTime() === current.getTime()) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else if (day.getTime() < current.getTime()) {
      break;
    }
  }

  return streak;
}

export default function StatsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const stats = useTasbihStore((s) => s.stats);
  const resetStats = useTasbihStore((s) => s.resetStats);
  const language = useTasbihStore((s) => s.preferences.language);
  const t = useT();
  const locale = language === "fr" ? "fr-FR" : "en-US";

  const total = stats.totalZikr;
  const sessions = stats.sessions;
  const activeDays = stats.activeDays;

  const moyenneJour = activeDays ? total / activeDays : 0;
  const moyenneSem = activeDays ? (total / activeDays) * 7 : 0;
  const moyenneSession = sessions ? total / sessions : 0;

  const streak = useMemo(() => {
    const dates = stats.history.map((h) => h.startAt.slice(0, 10));
    return computeStreak(dates);
  }, [stats.history]);

  const mostPracticed = useMemo(() => {
    const counts = new Map<string, number>();
    stats.history.forEach((h) => {
      if (!h.zikrId) return;
      counts.set(h.zikrId, (counts.get(h.zikrId) ?? 0) + h.zikrCount);
    });
    let bestId: string | null = null;
    let bestCount = 0;
    counts.forEach((count, id) => {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    });
    const zikr = bestId ? zikrs.find((d) => d.id === bestId) : undefined;
    return {
      label: zikr ? `${zikr.arabic} — ${zikr.transliteration}` : t("stats.none"),
      count: bestCount,
    };
  }, [stats.history, t]);

  const weeklyData = useMemo(() => buildLast7DaysZikrData(stats.history, locale), [stats.history, locale]);

  const recentHistory = useMemo(() => {
    return [...stats.history]
      .sort((a, b) => (a.startAt < b.startAt ? 1 : -1))
      .slice(0, 10);
  }, [stats.history]);

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
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("stats.title")}</h1>
          <p className="text-sm text-[var(--secondary)]">{t("stats.subtitle")}</p>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.totalZikrs")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{total}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.avgDay")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneJour)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.avgWeek")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneSem)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.sessions")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{sessions}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.avgSession")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneSession)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-[var(--secondary)]">{t("stats.activeDays")}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{activeDays}</div>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("stats.weeklyTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("stats.weeklySubtitle")}</div>
            </div>
            <div className="text-sm font-semibold text-[var(--primary)]">{t("stats.streak", { streak })}</div>
          </div>
          <div className="mt-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "var(--secondary)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--secondary)", fontSize: 12 }} />
                <Tooltip
                  wrapperStyle={{ borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}
                  contentStyle={{ background: "var(--card)", border: "none" }}
                  cursor={{ fill: "rgba(245, 166, 35, 0.15)" }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--secondary)]">{t("stats.mostPracticed")}</div>
            <div className="mt-2 text-[var(--foreground)]">{mostPracticed.label}</div>
            <div className="mt-1 text-xs text-[var(--secondary)]">{t("stats.totalCount", { count: mostPracticed.count })}</div>
          </div>

          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--secondary)]">{t("stats.historyTitle")}</div>
              <button
                onClick={resetStats}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
              >
                {t("stats.resetStats")}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {recentHistory.length === 0 ? (
                <div className="text-sm text-[var(--secondary)]">{t("stats.noSessions")}</div>
              ) : (
                recentHistory.map((entry) => {
                  const zikr = zikrs.find((d) => d.id === entry.zikrId);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2"
                    >
                      <div>
                        <div className="text-sm text-[var(--foreground)]">
                          {formatDate(entry.startAt, locale)} — {zikr?.arabic ?? "—"}
                        </div>
                        <div className="text-xs text-[var(--secondary)]">{zikr?.transliteration ?? ""}</div>
                      </div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">{entry.zikrCount}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </motion.main>
      <BottomNav />
    </div>
  );
}
