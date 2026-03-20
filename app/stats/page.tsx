"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTasbihStore } from "../../store/tasbihStore";
import {
  TASBIH_STORAGE_KEY,
  createBackupPayload,
  parseBackupPayload,
} from "../../store/tasbihStore";
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

function buildLast30DaysData(history: { startAt: string; zikrCount: number }[]) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const data: { date: string; label: string; total: number }[] = [];

  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    data.push({ date: key, label: key.slice(5), total: 0 });
  }

  history.forEach((entry) => {
    const key = entry.startAt.slice(0, 10);
    const row = data.find((r) => r.date === key);
    if (row) row.total += entry.zikrCount;
  });

  return data;
}

function buildWeekdayDistribution(history: { startAt: string; zikrCount: number }[], locale: string) {
  const labels: { key: number; label: string; total: number }[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    key: d,
    label: new Date(2024, 0, d + 7).toLocaleDateString(locale, { weekday: "short" }),
    total: 0,
  }));

  history.forEach((entry) => {
    const day = new Date(entry.startAt).getDay();
    const row = labels.find((d) => d.key === day);
    if (row) row.total += entry.zikrCount;
  });

  return labels;
}

function buildHourlyHeatmap(history: { startAt: string; zikrCount: number }[]) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0 }));
  history.forEach((entry) => {
    const hour = new Date(entry.startAt).getHours();
    const row = hours[hour];
    if (row) row.total += entry.zikrCount;
  });
  return hours;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState("");
  const locale = language === "fr" ? "fr-FR" : "en-US";

  const handleExportBackup = () => {
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = payload.exportedAt.slice(0, 10);
    a.href = url;
    a.download = `tasbih-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage(t("settings.backupExported"));
  };

  const handleImportBackupFile = async (file: File) => {
    const raw = await file.text();
    const parsed = parseBackupPayload(raw);
    if (!parsed.ok) {
      setBackupMessage(t("settings.backupImportError"));
      return;
    }

    window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(parsed.state));
    setBackupMessage(t("settings.backupImported"));
    window.setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const total = stats.totalZikr;
  const sessions = stats.sessions;
  const activeDays = stats.activeDays;
  const hasStatsData =
    total > 0 || sessions > 0 || activeDays > 0 || stats.history.length > 0;
  const canExport = hasStatsData;
  const canImport = !hasStatsData;

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
  const trend30Data = useMemo(() => buildLast30DaysData(stats.history), [stats.history]);
  const weekdayData = useMemo(() => buildWeekdayDistribution(stats.history, locale), [stats.history, locale]);
  const hourlyHeatmap = useMemo(() => buildHourlyHeatmap(stats.history), [stats.history]);
  const peakHour = useMemo(() => {
    if (hourlyHeatmap.length === 0) return 0;
    return hourlyHeatmap.reduce((best, row) => (row.total > best.total ? row : best), hourlyHeatmap[0]).hour;
  }, [hourlyHeatmap]);

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

        <section className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canImport}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                canImport
                  ? "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]"
                  : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] opacity-60 blur-[1px]"
              }`}
            >
              {t("settings.backupImportBtn")}
            </button>
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={!canExport}
              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                canExport
                  ? "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]"
                  : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] opacity-60 blur-[1px]"
              }`}
            >
              {t("settings.backupExportBtn")}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImportBackupFile(file);
              }
              e.currentTarget.value = "";
            }}
          />

          {backupMessage ? (
            <div className="text-xs text-[var(--secondary)]">{backupMessage}</div>
          ) : null}
        </section>

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

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("stats.trend30Title")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("stats.trend30Subtitle")}</div>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend30Data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "var(--secondary)", fontSize: 11 }} interval={4} />
                <YAxis tick={{ fill: "var(--secondary)", fontSize: 12 }} />
                <Tooltip
                  wrapperStyle={{ borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}
                  contentStyle={{ background: "var(--card)", border: "none" }}
                />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("stats.weekdayTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("stats.weekdaySubtitle")}</div>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "var(--secondary)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--secondary)", fontSize: 12 }} />
                <Tooltip
                  wrapperStyle={{ borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}
                  contentStyle={{ background: "var(--card)", border: "none" }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("stats.hourlyTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("stats.hourlySubtitle")}</div>
          <div className="mt-3 text-xs font-semibold text-[var(--primary)]">{t("stats.peakHour", { hour: peakHour })}</div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {hourlyHeatmap.map((entry) => {
              const max = Math.max(1, ...hourlyHeatmap.map((h) => h.total));
              const intensity = entry.total / max;
              return (
                <div
                  key={entry.hour}
                  className="rounded-lg border border-[var(--border)] p-2 text-center"
                  style={{ backgroundColor: `rgba(228, 177, 90, ${0.1 + intensity * 0.55})` }}
                >
                  <div className="text-[10px] font-semibold text-[var(--foreground)]">{String(entry.hour).padStart(2, "0")}h</div>
                  <div className="text-[10px] text-[var(--secondary)]">{entry.total}</div>
                </div>
              );
            })}
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
