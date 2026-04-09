"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import type { Theme, ReminderTime } from "../../store/tasbihStore";
import {
  TASBIH_STORAGE_KEY,
  createBackupPayload,
  parseBackupPayload,
} from "../../store/tasbihStore";
import { BottomNav } from "../../components/BottomNav";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT } from "@/hooks/useT";
import Link from "next/link";

const timeToString = (rt: ReminderTime) =>
  `${String(rt.hour).padStart(2, "0")}:${String(rt.minute).padStart(2, "0")}`;

const stringToTime = (s: string): ReminderTime => {
  const [h, m] = s.split(":").map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
};

export default function ReglagesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const setRemindersEnabled = useTasbihStore((s) => s.setRemindersEnabled);
  const setReminderTimes = useTasbihStore((s) => s.setReminderTimes);
  const setOptionalSyncEnabled = useTasbihStore((s) => s.setOptionalSyncEnabled);
  const resetPreferences = useTasbihStore((s) => s.resetPreferences);
  const t = useT();
  const [syncCode, setSyncCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState("");
  const [permissionResetPending, setPermissionResetPending] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return "unsupported";
    }
    return Notification.permission;
  });

  const applyThemeToDom = (theme: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body?.setAttribute("data-theme", theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const metaColor =
        theme === "light" ? "#F3F5F8" : theme === "dark" ? "#0A0A0A" : "#0B1118";
      themeMeta.setAttribute("content", metaColor);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    setPermissionResetPending(false);
    if (Notification.permission === "denied") {
      setNotificationPermission("denied");
      setPermissionDeniedMessage(t("settings.remindersPermissionDeniedHelp"));
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const sendTestNotification = async () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const body =
      preferences.language === "fr"
        ? "Rappel de zikr: qu'Allah accepte vos invocations."
        : "Zikr reminder: may Allah accept your invocations.";
    try {
      if (navigator.serviceWorker?.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("At-tasbih", { body, tag: "tasbih-test-reminder" });
      } else {
        new Notification("At-tasbih", { body, tag: "tasbih-test-reminder" });
      }
    } catch {
      // ignore
    }
  };

  const encodeSyncCode = (value: string) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const decodeSyncCode = (value: string) => {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const handleGenerateSyncCode = () => {
    const payload = createBackupPayload();
    const code = encodeSyncCode(JSON.stringify(payload));
    setSyncCode(code);
    setSyncMessage("");
  };

  const handleCopySyncCode = async () => {
    if (!syncCode) return;
    await navigator.clipboard.writeText(syncCode);
    setSyncMessage(t("settings.syncCopied"));
  };

  const handleImportSyncCode = () => {
    try {
      const decoded = decodeSyncCode(syncCode.trim());
      const parsed = parseBackupPayload(decoded);
      if (!parsed.ok) {
        setSyncMessage(t("settings.syncInvalid"));
        return;
      }
      window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(parsed.state));
      setSyncMessage(t("settings.syncImported"));
      window.setTimeout(() => window.location.reload(), 400);
    } catch {
      setSyncMessage(t("settings.syncInvalid"));
    }
  };

  const handleRestoreDefaultSettings = () => {
    resetPreferences();
    applyThemeToDom("light");
    setNotificationPermission("default");
    setPermissionResetPending(true);
    setSyncCode("");
    setSyncMessage("");
    setShowRestoreConfirm(false);
  };

  const effectiveNotificationPermission: NotificationPermission | "unsupported" =
    permissionResetPending && notificationPermission !== "unsupported"
      ? "default"
      : notificationPermission;

  if (!mounted) return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6 animate-pulse">
        <div className="h-6 w-24 rounded-lg bg-[var(--card)]" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-[var(--card)]" />)}
      </div>
      <BottomNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <motion.main
        className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("settings.title")}</h1>
          <p className="text-sm text-[var(--secondary)]">{t("settings.subtitle")}</p>
        </header>


        {/* 1. General Settings */}
        <Link
          href="/reglages/general"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.generalTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.generalHint")}
            </div>
          </div>
          <span className="text-base text-[var(--secondary)]">›</span>
        </Link>

        {/* 2. Appearance */}
        <Link
          href="/reglages/apparence"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.appearanceTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.appearanceHint")}
            </div>
          </div>
          <span className="text-base text-[var(--secondary)]">›</span>
        </Link>


        {/* 3. Selection Mode */}
        <Link
          href="/reglages/selection-mode"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.selectionModeTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.selectionModeHint")}</div>
          </div>
            <span className="text-base text-[var(--secondary)]">›</span>
        </Link>

        {/* 4. Auto-counter Settings */}
        <Link
          href="/reglages/auto"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.autoCounterSettingsTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.autoCounterSettingsHint")}
            </div>
          </div>
          <span className="text-base text-[var(--secondary)]">›</span>
        </Link>

        {/* 3. Audio Counter Settings */}
        <Link
          href="/reglages/audio"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.audioCounterSettingsTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.audioCounterSettingsHint")}
            </div>
          </div>
          <span className="text-base text-[var(--secondary)]">›</span>
        </Link>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.remindersTitle")}</div>
          <div className="mt-1 text-xs text-[var(--secondary)]">{t("settings.remindersHint")}</div>

          <div className="mt-3 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                void requestNotificationPermission();
              }}
              disabled={effectiveNotificationPermission === "granted"}
              className={`self-start rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition ${
                effectiveNotificationPermission === "granted"
                  ? "cursor-not-allowed bg-[var(--background)] text-[var(--secondary)] opacity-50"
                  : "bg-[var(--background)] text-[var(--foreground)]"
              }`}
            >
              {t("settings.remindersAskPermission")}
            </button>
            <span className="text-xs text-[var(--secondary)]">
              {effectiveNotificationPermission === "granted"
                ? t("settings.remindersPermissionGrantedStatus")
                : t("settings.remindersPermissionNotGrantedStatus")}
            </span>
            {permissionDeniedMessage ? (
              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)]">
                {permissionDeniedMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--foreground)]">{t("settings.remindersEnabled")}</span>
            <button
              type="button"
              onClick={() => {
                if (effectiveNotificationPermission !== "granted") {
                  setRemindersEnabled(false);
                  return;
                }
                const nextEnabled = !preferences.remindersEnabled;
                setRemindersEnabled(nextEnabled);
                if (nextEnabled && preferences.reminderTimes.length === 0) {
                  setReminderTimes([{ hour: 8, minute: 0 }]);
                }
              }}
              disabled={effectiveNotificationPermission !== "granted"}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.remindersEnabled
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              } ${effectiveNotificationPermission !== "granted" ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {preferences.remindersEnabled ? t("settings.on") : t("settings.off")}
            </button>
          </div>

          {preferences.remindersEnabled ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--foreground)]">{t("settings.remindersScheduleDaily")}</span>
                <input
                  type="time"
                  value={timeToString(preferences.reminderTimes[0] ?? { hour: 8, minute: 0 })}
                  onChange={(e) => {
                    const next = stringToTime(e.target.value);
                    setReminderTimes([next]);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </>
          ) : null}

          <div className="mt-3">
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={notificationPermission !== "granted"}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                notificationPermission === "granted"
                  ? "bg-[var(--primary)] text-black"
                  : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] opacity-50"
              }`}
            >
              {t("settings.remindersTest")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.syncTitle")}</div>
          <div className="mt-1 text-xs text-[var(--secondary)]">{t("settings.syncHint")}</div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--foreground)]">{t("settings.syncEnable")}</span>
            <button
              type="button"
              onClick={() => setOptionalSyncEnabled(!preferences.optionalSyncEnabled)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.optionalSyncEnabled
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.optionalSyncEnabled ? t("settings.on") : t("settings.off")}
            </button>
          </div>

          {preferences.optionalSyncEnabled ? (
            <>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSyncCode}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  {t("settings.syncGenerate")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopySyncCode();
                  }}
                  disabled={!syncCode}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                    syncCode
                      ? "bg-[var(--primary)] text-black"
                      : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)]"
                  }`}
                >
                  {t("settings.syncCopy")}
                </button>
              </div>

              <textarea
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder={t("settings.syncPlaceholder")}
                className="mt-3 min-h-[90px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <button
                type="button"
                onClick={handleImportSyncCode}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("settings.syncImport")}
              </button>

              {syncMessage ? <div className="mt-2 text-xs text-[var(--secondary)]">{syncMessage}</div> : null}
            </>
          ) : null}
        </section>


        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowRestoreConfirm(true)}
            className="rounded-xl border border-[var(--restore-border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--restore)] transition hover:border-[var(--restore)]"
          >
            {t("settings.restoreDefaults")}
          </button>
        </div>

        <Link
          href="/aide"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.helpTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.helpHint")}
            </div>
          </div>
          <span className="text-[var(--secondary)] text-base">›</span>
        </Link>

        <Link
          href="/about"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3 transition hover:brightness-95 active:brightness-90"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("about.settingsLink")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("about.settingsHint")}
            </div>
          </div>
          <span className="text-[var(--secondary)] text-base">›</span>
        </Link>

        <div className="mt-2 text-center text-xs text-[var(--secondary)]">
          {t("settings.version")}
        </div>
      </motion.main>

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title={t("settings.restoreDefaultsConfirmTitle")}
        body={t("settings.restoreDefaultsConfirmBody")}
        cancelLabel={t("settings.restoreDefaultsConfirmCancel")}
        confirmLabel={t("settings.restoreDefaultsConfirmConfirm")}
        confirmClassName="flex-1 rounded-xl border border-[var(--restore-border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--restore)]"
        onCancel={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestoreDefaultSettings}
      />

      <BottomNav />
    </div>
  );
}
