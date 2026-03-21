"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

type HistoryRangeMode = "day" | "week" | "month";

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

function toUtcDateKey(value: string) {
  if (typeof value === "string" && value.length >= 10) {
    const directKey = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(directKey)) {
      return directKey;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function computeStreak(history: { startAt: string }[]) {
  const activeDays = new Set(
    history
      .map((entry) => toUtcDateKey(entry.startAt))
      .filter((key): key is string => key !== null)
  );

  if (activeDays.size === 0) return 0;

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const todayKey = cursor.toISOString().slice(0, 10);

  // If user has not practiced yet today, continue streak from yesterday.
  if (!activeDays.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!activeDays.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
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
  const toastTimerRef = useRef<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [historyRangeMode, setHistoryRangeMode] = useState<HistoryRangeMode>("month");
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const locale = language === "fr" ? "fr-FR" : "en-US";

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 1300);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

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
    showToast(t("stats.toastExported"));
  };

  const handleImportBackupFile = async (file: File) => {
    const raw = await file.text();
    const parsed = parseBackupPayload(raw);
    if (!parsed.ok) {
      return;
    }

    window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(parsed.state));
    showToast(t("stats.toastImported"));
    window.setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  const handleResetStatsConfirm = () => {
    resetStats();
    setShowResetConfirm(false);
    showToast(t("stats.toastReset"));
  };

  const total = stats.totalZikr;
  const sessions = stats.sessions;
  const activeDays = stats.activeDays;
  const todayKey = new Date().toISOString().slice(0, 10);
  const last30StartDate = new Date();
  last30StartDate.setHours(0, 0, 0, 0);
  last30StartDate.setDate(last30StartDate.getDate() - 29);
  const last30StartKey = last30StartDate.toISOString().slice(0, 10);
  const hasStatsData =
    total > 0 || sessions > 0 || activeDays > 0 || stats.history.length > 0;
  const canExport = hasStatsData;
  const canImport = !hasStatsData;

  const moyenneJour = activeDays ? total / activeDays : 0;
  const moyenneSem = activeDays ? (total / activeDays) * 7 : 0;
  const moyenneSession = sessions ? total / sessions : 0;

  const streak = useMemo(() => computeStreak(stats.history), [stats.history]);

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

  const filteredHistory = useMemo(() => {
    const last30History = stats.history.filter((entry) => {
      const entryDate = entry.startAt.slice(0, 10);
      return entryDate >= last30StartKey && entryDate <= todayKey;
    });

    if (historyRangeMode === "month") {
      return [...last30History].sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
    }

    if (historyRangeMode === "day") {
      return last30History
        .filter((entry) => entry.startAt.slice(0, 10) === historyDate)
        .sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
    }

    const selected = new Date(`${historyDate}T00:00:00`);
    const day = selected.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return last30History
      .filter((entry) => {
        const entryDate = new Date(entry.startAt);
        return entryDate >= weekStart && entryDate <= weekEnd;
      })
      .sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
  }, [stats.history, historyRangeMode, historyDate, last30StartKey, todayKey]);

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
                  ? "border border-[var(--border)] bg-white text-black hover:border-[var(--primary)]"
                  : "cursor-not-allowed border border-[var(--border)] bg-white text-[var(--secondary)] opacity-60 blur-[0.5px]"
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
                  ? "border-[var(--border)] bg-white text-black hover:border-[var(--primary)]"
                  : "cursor-not-allowed border-[var(--border)] bg-white text-[var(--secondary)] opacity-60 blur-[0.5px]"
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
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--secondary)]">{t("stats.historyTitle")}</div>
              <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
                {([
                  { key: "day", label: t("stats.filterDay") },
                  { key: "week", label: t("stats.filterWeek") },
                  { key: "month", label: t("stats.filterMonth") },
                ] as { key: HistoryRangeMode; label: string }[]).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setHistoryRangeMode(option.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      historyRangeMode === option.key
                        ? "bg-[var(--primary)] text-black"
                        : "text-[var(--secondary)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {historyRangeMode !== "month" ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <label htmlFor="history-date" className="text-xs font-semibold text-[var(--secondary)]">
                  {historyRangeMode === "day" ? t("stats.filterDayLabel") : t("stats.filterWeekLabel")}
                </label>
                <input
                  id="history-date"
                  type="date"
                  value={historyDate}
                  min={last30StartKey}
                  max={todayKey}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-sm text-[var(--secondary)]">{t("stats.noSessions")}</div>
              ) : (
                filteredHistory.map((entry) => {
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

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-xl border border-[#E7B4B4] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[#C62828] transition hover:border-[#C62828]"
          >
            {t("stats.resetStats")}
          </button>
        </div>
      </motion.main>
      {toastMessage ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="rounded-md bg-black/75 px-3 py-2 text-center text-xs font-semibold text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      ) : null}

      {showResetConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t("stats.resetConfirmTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--secondary)]">{t("stats.resetConfirmBody")}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("stats.resetConfirmCancel")}
              </button>
              <button
                type="button"
                onClick={handleResetStatsConfirm}
                className="flex-1 rounded-xl border border-[#E7B4B4] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[#C62828]"
              >
                {t("stats.resetConfirmConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </div>
  );
}
