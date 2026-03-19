"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTasbihStore } from "../../store/tasbihStore";
import { dhikrs } from "../../data/dhikrs";
import { BottomNav } from "../../components/BottomNav";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function buildLast7DaysData(history: { startAt: string; dhikrCount: number }[]) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const data: { day: string; date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    data.push({ day: dayLabel(d), date: key, total: 0 });
  }

  history.forEach((entry) => {
    const key = entry.startAt.slice(0, 10);
    const row = data.find((r) => r.date === key);
    if (row) row.total += entry.dhikrCount;
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

  const total = stats.totalDhikr;
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
      if (!h.dhikrId) return;
      counts.set(h.dhikrId, (counts.get(h.dhikrId) ?? 0) + h.dhikrCount);
    });
    let bestId: string | null = null;
    let bestCount = 0;
    counts.forEach((count, id) => {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    });
    const dhikr = bestId ? dhikrs.find((d) => d.id === bestId) : undefined;
    return {
      label: dhikr ? `${dhikr.arabic} — ${dhikr.transliteration}` : "Aucun",
      count: bestCount,
    };
  }, [stats.history]);

  const weeklyData = useMemo(() => buildLast7DaysData(stats.history), [stats.history]);

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
          <h1 className="text-xl font-semibold text-[var(--foreground)]">📊 Stats</h1>
          <p className="text-sm text-gray-400">Suivi de votre pratique de Zikr</p>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Total zikrs</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{total}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Moy. / jour</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneJour)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Moy. / sem.</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneSem)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Sessions</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{sessions}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Moy. session</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{Math.round(moyenneSession)}</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="text-xs font-semibold text-gray-400">Jours actifs</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{activeDays}</div>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">Hebdomadaire</div>
              <div className="text-xs text-gray-400">Zikrs sur les 7 derniers jours</div>
            </div>
            <div className="text-sm font-semibold text-[var(--primary)]">{streak}j streak</div>
          </div>
          <div className="mt-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
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
            <div className="text-sm font-semibold text-gray-400">Zikr le plus pratiqué</div>
            <div className="mt-2 text-[var(--foreground)]">{mostPracticed.label}</div>
            <div className="mt-1 text-xs text-gray-400">Total : {mostPracticed.count}</div>
          </div>

          <div className="rounded-2xl bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-400">Historique des sessions</div>
              <button
                onClick={resetStats}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
              >
                Réinitialiser
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {recentHistory.length === 0 ? (
                <div className="text-sm text-gray-400">Aucune session enregistrée.</div>
              ) : (
                recentHistory.map((entry) => {
                  const dhikr = dhikrs.find((d) => d.id === entry.dhikrId);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2"
                    >
                      <div>
                        <div className="text-sm text-[var(--foreground)]">
                          {formatDate(entry.startAt)} — {dhikr?.arabic ?? "—"}
                        </div>
                        <div className="text-xs text-gray-400">{dhikr?.transliteration ?? ""}</div>
                      </div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">{entry.dhikrCount}</div>
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
