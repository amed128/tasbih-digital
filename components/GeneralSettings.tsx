import { useSyncExternalStore, useState } from "react";
import { useTasbihStore, APP_MAX_TARGET } from "@/store/tasbihStore";
import type { IconTheme, TapButtonSize } from "@/store/tasbihStore";
import { useT } from "@/hooks/useT";
import { isNativeApp } from "@/lib/platform";

export default function GeneralSettings() {
  const t = useT();
  const preferences = useTasbihStore((s) => s.preferences);

  const isIosPwa = useSyncExternalStore(
    () => () => {},
    () =>
      window.matchMedia("(display-mode: standalone)").matches &&
      /iP(hone|ad|od)/.test(navigator.userAgent),
    () => false
  );
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const setWakeLockEnabled = useTasbihStore((s) => s.setWakeLockEnabled);
  const setLanguage = useTasbihStore((s) => s.setLanguage);
  const setDefaultMaxTarget = useTasbihStore((s) => s.setDefaultMaxTarget);
  const setIconTheme = useTasbihStore((s) => s.setIconTheme);
  const toggleConfetti = useTasbihStore((s) => s.toggleConfetti);
  const setTapButtonSize = useTasbihStore((s) => s.setTapButtonSize);

  const iconThemeOptions: { value: IconTheme; label: string }[] = [
    { value: "auto", label: t("settings.iconThemeAuto") },
    { value: "dark", label: t("settings.iconThemeDark") },
    { value: "blue", label: t("settings.iconThemeBlue") },
    { value: "light", label: t("settings.iconThemeLight") },
  ];
  const [maxTargetRaw, setMaxTargetRaw] = useState(() =>
    String(preferences.defaultMaxTarget ?? 9999)
  );

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
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
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
          {isIosPwa && (
            <div className="mt-1 text-xs text-[var(--secondary)] opacity-70">{t("settings.vibrationIOS")}</div>
          )}
        </div>
        <button
          onClick={toggleVibration}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 ${
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
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.wakeLockTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.wakeLockHint")}</div>
        </div>
        <button
          onClick={() => setWakeLockEnabled(!preferences.wakeLockEnabled)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 ${
            preferences.wakeLockEnabled
              ? "bg-[var(--primary)] text-black"
              : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
          }`}
        >
          {preferences.wakeLockEnabled ? t("settings.on") : t("settings.off")}
        </button>
      </section>

      {/* Default max target */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.defaultMaxTargetTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.defaultMaxTargetHint")}</div>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={APP_MAX_TARGET}
              step={1}
              inputMode="numeric"
              value={maxTargetRaw}
              onChange={(e) => {
                setMaxTargetRaw(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= APP_MAX_TARGET) {
                  setDefaultMaxTarget(val);
                }
              }}
              onBlur={() => {
                const val = parseInt(maxTargetRaw, 10);
                const clamped = isNaN(val) || val < 1 ? 1 : Math.min(val, APP_MAX_TARGET);
                setMaxTargetRaw(String(clamped));
                setDefaultMaxTarget(clamped);
              }}
              className="w-28 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
            />
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.langTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.languageHint")}</div>
          </div>
          <select
            value={preferences.language}
            onChange={(e) => setLanguage(e.target.value as typeof preferences.language)}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
            aria-label={t("settings.ariaLanguage")}
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="es">🇪🇸 Español</option>
            <option value="pt">🇧🇷 Português</option>
            <option value="hi">🇮🇳 हिन्दी</option>
            <option value="ar">🇸🇦 العربية</option>
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="ur">🇵🇰 اردو</option>
            <option value="bn">🇧🇩 বাংলা</option>
            <option value="id">🇮🇩 Bahasa Indonesia</option>
            <option value="ms">🇲🇾 Bahasa Melayu</option>
          </select>
        </div>
      </section>

      {/* App icon (native only) */}
      {isNativeApp() && (
        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.iconThemeTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.iconThemeHint")}</div>
            </div>
            <select
              value={preferences.iconTheme ?? "auto"}
              onChange={(e) => setIconTheme(e.target.value as IconTheme)}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
              aria-label={t("settings.ariaIconTheme")}
            >
              {iconThemeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Tap button size */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.tapButtonSizeTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.tapButtonSizeHint")}</div>
          </div>
          <select
            value={preferences.tapButtonSize ?? "normal"}
            onChange={(e) => setTapButtonSize(e.target.value as TapButtonSize)}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
          >
            <option value="normal">{t("settings.tapButtonSizeNormal")}</option>
            <option value="double">{t("settings.tapButtonSizeDouble")}</option>
            <option value="triple">{t("settings.tapButtonSizeTriple")}</option>
          </select>
        </div>
      </section>

      {/* Confetti */}
      <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.confettiTitle")}</div>
          <div className="text-xs text-[var(--secondary)]">{t("settings.confettiHint")}</div>
        </div>
        <button
          onClick={toggleConfetti}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 ${
            preferences.confetti
              ? "bg-[var(--primary)] text-black"
              : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
          }`}
        >
          {preferences.confetti ? t("settings.on") : t("settings.off")}
        </button>
      </section>
    </div>
  );
}
