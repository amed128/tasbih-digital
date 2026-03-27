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
      <div>
        <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.soundTitle")}</div>
        <div className="text-xs text-[var(--secondary)]">{t("settings.soundHint")}</div>
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
      {/* Vibration */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.vibrationTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.vibrationHint")}</div>
        </div>
        <input
          type="checkbox"
          checked={preferences.vibration}
          onChange={toggleVibration}
          className="form-checkbox h-5 w-5 text-[var(--primary)]"
          aria-label={t("settings.ariaVibration")}
        />
      </div>
      {/* Keep screen awake */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.keepScreenAwakeTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.keepScreenAwakeHint")}</div>
        </div>
        <input
          type="checkbox"
          checked={preferences.wakeLockEnabled}
          onChange={() => setWakeLockEnabled(!preferences.wakeLockEnabled)}
          className="form-checkbox h-5 w-5 text-[var(--primary)]"
          aria-label={t("settings.ariaKeepScreenAwake")}
        />
      </div>
      {/* Language */}
      <div>
        <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.languageTitle")}</div>
        <div className="text-xs text-[var(--secondary)]">{t("settings.languageHint")}</div>
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
    </div>
  );
}
