import { useTasbihStore } from "@/store/tasbihStore";
import { useT } from "@/hooks/useT";

export default function GeneralSettings() {
  const t = useT();
  const preferences = useTasbihStore((s) => s.preferences);
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const setWakeLockEnabled = useTasbihStore((s) => s.setWakeLockEnabled);
  const setLanguage = useTasbihStore((s) => s.setLanguage);

  return (
    <div className="flex flex-col gap-4">
      {/* Sound */}

      <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.soundTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.soundHint")}</div>
          </div>
          <select
            value={preferences.tapSound}
            onChange={(e) => setTapSound(e.target.value as typeof preferences.tapSound)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            aria-label={t("settings.ariaSound")}
          >
            <option value="off">{t("settings.soundOff")}</option>
            <option value="tap-soft">{t("settings.soundSoft")}</option>
            <option value="button-click">{t("settings.soundClick")}</option>
            <option value="haptic-pulse">{t("settings.soundPulse")}</option>
          </select>
        </div>
      </section>

      {/* Vibration */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.vibrationTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.vibrationHint")}</div>
        </div>
        <button
          onClick={toggleVibration}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            preferences.vibration
              ? "bg-[var(--primary)] text-black"
              : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
          }`}
        >
          {preferences.vibration ? t("settings.on") : t("settings.off")}
        </button>
      </section>

      {/* Keep screen awake */}

      <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.wakeLockTitle", "Keep screen awake")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.wakeLockHint", "Prevents sleep while an active counter is running")}</div>
        </div>
        <button
          onClick={() => setWakeLockEnabled(!preferences.wakeLockEnabled)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            preferences.wakeLockEnabled
              ? "bg-[var(--primary)] text-black"
              : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
          }`}
        >
          {preferences.wakeLockEnabled ? t("settings.on") : t("settings.off")}
        </button>
      </section>

      {/* Language */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.langTitle", "Language")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.languageHint", "Choose the app language")}</div>
          </div>
          <select
            value={preferences.language}
            onChange={(e) => setLanguage(e.target.value as typeof preferences.language)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            aria-label={t("settings.ariaLanguage")}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </section>
    </div>
  );
}
