import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DEFAULT_LIST_ID, zikrs, predefinedLists } from "../data/zikrs";
import type { Zikr } from "../data/zikrs";

export type Mode = "up" | "down" | "auto" | "audio";

const MODE_SEQUENCE: Mode[] = ["up", "down", "auto", "audio"];

const isDownMode = (mode: Mode) => mode === "down";

const initialCounterForMode = (mode: Mode, target: number) => (isDownMode(mode) ? target : 0);

const normalizeMode = (value: unknown): Mode => {
  if (value === "up" || value === "down" || value === "auto" || value === "audio") return value;
  return "up";
};

export type SessionRecord = {
  id: string;
  startAt: string; // ISO
  endAt?: string;
  zikrCount: number;
  listId?: string;
  zikrId?: string;
};

export type Stats = {
  totalZikr: number;
  sessions: number;
  activeDays: number;
  history: SessionRecord[];
};

export type Preferences = {
  // --- Auto-counter settings ---
  autoCounterDefaultEnabled: boolean;
  autoCounterDefaultSpeed: number;
  autoCounterResumeAfterReset: boolean;
    autoCounterResumeOnNext: boolean;
  autoCounterStopAtGoal: boolean;
  autoCounterEntryAutoStart: boolean;
  blurActionControlsWhileAuto: boolean;
  autoCounterConfirmOnStop: boolean;
  autoCounterSoundOnTick: boolean;
  autoCounterVibrateOnTick: boolean;
  theme: Theme;
  vibration: boolean;
  wakeLockEnabled: boolean;
  tapSound: TapSound;
  speechTolerance: SpeechTolerance;
  speechRecognitionLanguage: SpeechRecognitionLanguage;
  audioSilenceTimeoutSec: number;
  audioTranscriptClearDelaySec: number;
  blurActionControlsWhileListening: boolean;
  chipTextFormat: ChipTextFormat;
  audioClearTranscriptOnSilence: boolean;
  audioStopOnSilence: boolean;
  audioDebugTelemetry: boolean;
  language: "fr" | "en";
  confetti: boolean;
  remindersEnabled: boolean;
  reminderScheduleType: ReminderScheduleType;
  reminderTimes: ReminderTime[];
  reminderDays: number[];
  optionalSyncEnabled: boolean;
  autoAdvanceNextZikr?: boolean;
  // Phase 2: Advanced timing mode (override cooldown/rearm for current profile)
  advancedTiming?: AdvancedTimingConfig;
  // Phase 4: Custom profiles (user-defined tolerance profiles)
  customProfiles?: CustomToleranceProfile[];
  activeCustomProfileId?: string;
  // Icon theme (auto = follows app theme)
  iconTheme?: IconTheme;
  // Zikr selection mode: reset counter when going back to a previous zikr
  resetOnPrev: boolean;
};

export type TapSound = "off" | "tap-soft" | "button-click" | "haptic-pulse";
export type SpeechTolerance = "strict" | "balanced" | "tolerant";
export type SpeechRecognitionLanguage = "ar-SA" | "ar-EG" | "ar-MA" | "fr-FR" | "en-US";
export type ChipTextFormat = "transliteration" | "arabic" | "both";
export type Theme = "light" | "dark" | "blue";
export type IconTheme = "auto" | "dark" | "blue" | "light";
export type ReminderTime = { hour: number; minute: number };
export type ReminderScheduleType = "daily" | "weekly";

/**
 * Advanced timing overrides for speech tolerance.
 * Allows customizing cooldown and rearm behavior while keeping matching strictness from profile.
 */
export type AdvancedTimingConfig = {
  enabled: boolean;
  cooldownMs?: number;
  rearmProgress?: number;
};

/**
 * Custom tolerance profile with all matching and timing rules.
 */
export type CustomToleranceProfile = {
  id: string;
  name: string;
  allowPartial: boolean;
  minOrderedCoverage: number;
  minOrderedWords: number;
  enableNearMissShortcut: boolean;
  partialMinLengthRatio: number;
  nearMissMaxLengthDiff: number;
  cooldownMs: number;
  rearmProgress: number;
};

export type TasbihStoreState = {
  // Current selected zikr
  currentZikrId: string;
  currentZikr: Zikr | undefined;
  // Counter
  counter: number;
  isStarted: boolean;
  mode: Mode;
  customTarget?: number;
  // Active list and index
  activeListId: string;
  activeList: string[];
  activeIndex: number;
  // Saved per-index counter progress for Zikr selection mode
  listProgress: Record<number, number>;
  // Stats & history
  stats: Stats;
  currentSessionCount: number;
  sessionStartAt?: string;
  // Custom lists
  customLists: Record<string, string[]>;
  customZikrs: Record<string, Zikr>;
  // Preferences
  preferences: Preferences;
  // Listes page UI state (persisted across tab navigation)
  listesUI: {
    libraryExpanded: boolean;
    expandedCategories: Record<string, boolean>;
    expandedLists: Record<string, boolean>;
  };
  // Actions
  increment: () => void;
  previousZikrInList: () => void;
  decrement: () => void;
  reset: () => void;
  undoLast: () => void;
  nextZikrInList: () => void;
  selectZikr: (zikrId: string) => void;
  selectZikrAsList: (zikrId: string) => void;
  selectRoutine: (label: string, zikrIds: string[]) => void;
  selectList: (listId: string) => void;
  setCustomTarget: (target?: number) => void;
  toggleMode: () => void;
  setListesUI: (update: Partial<TasbihStoreState["listesUI"]>) => void;
  resetStats: () => void;
  setTheme: (theme: Theme) => void;
  setIconTheme: (iconTheme: IconTheme) => void;
  toggleVibration: () => void;
  setWakeLockEnabled: (enabled: boolean) => void;
  toggleConfetti: () => void;
  setTapSound: (sound: TapSound) => void;
  setSpeechTolerance: (tolerance: SpeechTolerance) => void;
  setSpeechRecognitionLanguage: (language: SpeechRecognitionLanguage) => void;
  setAudioSilenceTimeoutSec: (seconds: number) => void;
  setAudioTranscriptClearDelaySec: (seconds: number) => void;
  setBlurActionControlsWhileListening: (enabled: boolean) => void;
  setChipTextFormat: (format: ChipTextFormat) => void;
  setAudioClearTranscriptOnSilence: (enabled: boolean) => void;
  setAudioStopOnSilence: (enabled: boolean) => void;
  setAudioDebugTelemetry: (enabled: boolean) => void;
  setLanguage: (lang: "fr" | "en") => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderScheduleType: (type: ReminderScheduleType) => void;
  setReminderTimes: (times: ReminderTime[]) => void;
  setReminderDays: (days: number[]) => void;
  setOptionalSyncEnabled: (enabled: boolean) => void;
  setAutoAdvanceNextZikr: (enabled: boolean) => void;
  setResetOnPrev: (value: boolean) => void;
  clearListProgress: () => void;
  setAutoCounterDefaultEnabled: (enabled: boolean) => void;
  setAutoCounterDefaultSpeed: (speed: number) => void;
  setAutoCounterResumeAfterReset: (enabled: boolean) => void;
  setAutoCounterStopAtGoal: (enabled: boolean) => void;
  setAutoCounterEntryAutoStart: (enabled: boolean) => void;
  setBlurActionControlsWhileAuto: (enabled: boolean) => void;
  setAutoCounterConfirmOnStop: (enabled: boolean) => void;
  setAutoCounterSoundOnTick: (enabled: boolean) => void;
  resetPreferences: () => void;
  // Phase 2: Advanced timing controls
  setAdvancedTiming: (config: AdvancedTimingConfig) => void;
  // Phase 4: Custom profile management
  createCustomProfile: (profile: Omit<CustomToleranceProfile, "id">) => void;
  updateCustomProfile: (id: string, profile: Omit<CustomToleranceProfile, "id">) => void;
  deleteCustomProfile: (id: string) => void;
  setActiveCustomProfile: (id: string | undefined) => void;
  createList: (listName: string) => void;
  deleteList: (listId: string) => void;
  renameList: (oldId: string, newId: string) => void;
  upsertCustomZikr: (zikr: Zikr) => void;
  addToList: (listId: string, zikrId: string) => void;
  removeFromList: (listId: string, zikrId: string) => void;
  moveInList: (listId: string, fromIndex: number, toIndex: number) => void;
  reorderLists: (fromId: string, toId: string) => void;
};

const STORAGE_KEY = "tasbihDigitalStateV1";
export const TASBIH_STORAGE_KEY = STORAGE_KEY;
const LEGACY_DEFAULT_LIST_LABEL = "Zikr de base";
const LEGACY_DEFAULT_LIST_ID = "base-dhikr";

export type TasbihBackupPayload = {
  app: "tasbih-digital";
  version: 1;
  exportedAt: string;
  state: Partial<TasbihStoreState>;
};

const normalizeListId = (listId: string): string =>
  listId === LEGACY_DEFAULT_LIST_LABEL || listId === LEGACY_DEFAULT_LIST_ID
    ? DEFAULT_LIST_ID
    : listId;

const normalizeZikrId = (zikrId: string): string =>
  zikrId.startsWith("dhikr-") ? `zikr-${zikrId.slice("dhikr-".length)}` : zikrId;

const normalizeZikrCategory = (category: unknown): Zikr["category"] =>
  category === "Dhikr général" ? "Zikr général" : (category as Zikr["category"]);

const normalizeStoredZikr = (value: unknown): Zikr | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const zikr = value as Zikr;
  return {
    ...zikr,
    id: normalizeZikrId(zikr.id),
    category: normalizeZikrCategory(zikr.category),
  };
};

const normalizeStoredZikrs = (value: unknown): Record<string, Zikr> => {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([zikrId, zikrValue]) => {
      const normalizedZikr = normalizeStoredZikr(zikrValue);
      if (!normalizedZikr) return [];
      return [[normalizeZikrId(zikrId), normalizedZikr] as const];
    })
  );
};

const normalizeStoredHistory = (value: unknown): SessionRecord[] => {
  if (!Array.isArray(value)) return [];

  return value.map((entry) => {
    const record = entry as SessionRecord & {
      dhikrCount?: number;
      dhikrId?: string;
    };

    return {
      ...record,
      zikrCount: record.zikrCount ?? record.dhikrCount ?? 0,
      zikrId:
        typeof record.zikrId === "string"
          ? normalizeZikrId(record.zikrId)
          : typeof record.dhikrId === "string"
            ? normalizeZikrId(record.dhikrId)
            : undefined,
    };
  });
};

const normalizeStoredLists = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([listId, ids]) => [
      normalizeListId(listId),
      Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === "string").map(normalizeZikrId)
        : [],
    ])
  );
};

function migrateStoredState(rawState: unknown): Partial<TasbihStoreState> | null {
  if (!rawState || typeof rawState !== "object") return null;

  const legacy = rawState as Record<string, unknown>;
  const stats = legacy.stats as Record<string, unknown> | undefined;
  const currentZikrId =
    typeof legacy.currentZikrId === "string"
      ? legacy.currentZikrId
      : typeof legacy.currentDhikrId === "string"
        ? legacy.currentDhikrId
        : undefined;

  return {
    ...(legacy as Partial<TasbihStoreState>),
    mode: normalizeMode(legacy.mode),
    currentZikrId: currentZikrId ? normalizeZikrId(currentZikrId) : undefined,
    currentZikr: normalizeStoredZikr(legacy.currentZikr ?? legacy.currentDhikr),
    activeListId:
      typeof legacy.activeListId === "string" ? normalizeListId(legacy.activeListId) : undefined,
    activeList: Array.isArray(legacy.activeList)
      ? legacy.activeList
          .filter((id): id is string => typeof id === "string")
          .map(normalizeZikrId)
      : undefined,
    customLists: normalizeStoredLists(legacy.customLists),
    customZikrs: normalizeStoredZikrs(legacy.customZikrs ?? legacy.customDhikrs),
    stats: stats
      ? {
          ...(stats as Partial<Stats>),
          totalZikr:
            typeof stats.totalZikr === "number"
              ? stats.totalZikr
              : typeof stats.totalDhikr === "number"
                ? stats.totalDhikr
                : 0,
          sessions: typeof stats.sessions === "number" ? stats.sessions : 0,
          activeDays: typeof stats.activeDays === "number" ? stats.activeDays : 0,
          history: normalizeStoredHistory(stats.history),
        }
      : undefined,
  };
}

function getInitialState(): Partial<TasbihStoreState> {
  const listId = DEFAULT_LIST_ID;
  const list = predefinedLists[listId] ?? [];
  const firstZikrId = list.length > 0 ? list[0] : "";

  return {
    currentZikrId: firstZikrId,
    currentZikr: undefined,
    counter: 0,
    isStarted: false,
    mode: "up",
    customTarget: undefined,
    activeListId: listId,
    activeList: list,
    activeIndex: 0,
    listProgress: {},
    stats: {
      totalZikr: 0,
      sessions: 0,
      activeDays: 0,
      history: [],
    },
    currentSessionCount: 0,
    sessionStartAt: undefined,
    customLists: {},
    customZikrs: {},
    listesUI: {
      libraryExpanded: true,
      expandedCategories: {},
      expandedLists: {},
    },
    preferences: {
      // --- Auto-counter settings ---
      autoCounterDefaultEnabled: false,
      autoCounterDefaultSpeed: 1000,
      autoCounterResumeAfterReset: false,
        autoCounterResumeOnNext: true,
      autoCounterStopAtGoal: true,
      autoCounterEntryAutoStart: false,
      blurActionControlsWhileAuto: true,
      autoCounterConfirmOnStop: false,
      autoCounterSoundOnTick: false,
      autoCounterVibrateOnTick: false,
      theme: "light",
      vibration: false,
      wakeLockEnabled: false,
      tapSound: "off",
      speechTolerance: "balanced",
      speechRecognitionLanguage: "ar-SA",
      audioSilenceTimeoutSec: 15,
      audioTranscriptClearDelaySec: 3,
      blurActionControlsWhileListening: false,
      chipTextFormat: "transliteration",
      audioClearTranscriptOnSilence: true,
      audioStopOnSilence: true,
      audioDebugTelemetry: false,
      language: "en",
      confetti: false,
      remindersEnabled: false,
      reminderScheduleType: "daily" as ReminderScheduleType,
      reminderTimes: [] as ReminderTime[],
      reminderDays: [] as number[],
      optionalSyncEnabled: false,
      autoAdvanceNextZikr: false,
      advancedTiming: { enabled: false },
      customProfiles: [],
      activeCustomProfileId: undefined,
      iconTheme: "auto" as IconTheme,
      resetOnPrev: true,
    },
  };
}

function loadStateFromStorage(): Partial<TasbihStoreState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateStoredState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistState(state: Partial<TasbihStoreState>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
}

const toPersistedState = (state: TasbihStoreState): Partial<TasbihStoreState> => ({
  currentZikrId: state.currentZikrId,
  currentZikr: state.currentZikr,
  counter: state.counter,
  isStarted: state.isStarted,
  mode: state.mode,
  customTarget: state.customTarget,
  activeListId: state.activeListId,
  activeList: state.activeList,
  activeIndex: state.activeIndex,
  stats: state.stats,
  currentSessionCount: state.currentSessionCount,
  sessionStartAt: state.sessionStartAt,
  customLists: state.customLists,
  customZikrs: state.customZikrs,
  preferences: state.preferences,
  listesUI: state.listesUI,
});

export function createBackupPayload(): TasbihBackupPayload {
  const state = useTasbihStore.getState();
  return {
    app: "tasbih-digital",
    version: 1,
    exportedAt: new Date().toISOString(),
    state: toPersistedState(state),
  };
}

export function parseBackupPayload(
  raw: string
): { ok: true; state: Partial<TasbihStoreState> } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as
      | TasbihBackupPayload
      | {
          state?: unknown;
        }
      | unknown;

    const maybeState =
      parsed && typeof parsed === "object" && "state" in parsed
        ? (parsed as { state?: unknown }).state
        : parsed;

    const migrated = migrateStoredState(maybeState);
    if (!migrated) {
      return { ok: false, error: "Invalid backup structure" };
    }

    return { ok: true, state: migrated };
  } catch {
    return { ok: false, error: "Invalid JSON file" };
  }
}

const normalizeTapSound = (value: unknown): TapSound => {
  if (value === "off") return "off";
  if (value === "tap-soft") return "tap-soft";
  if (value === "button-click") return "button-click";
  if (value === "haptic-pulse") return "haptic-pulse";
  return "tap-soft";
};

const normalizeSpeechTolerance = (value: unknown): SpeechTolerance => {
  if (value === "strict") return "strict";
  if (value === "balanced") return "balanced";
  if (value === "tolerant") return "tolerant";
  return "balanced";
};

const normalizeSpeechRecognitionLanguage = (value: unknown): SpeechRecognitionLanguage => {
  if (value === "ar-SA") return "ar-SA";
  if (value === "ar-EG") return "ar-EG";
  if (value === "ar-MA") return "ar-MA";
  if (value === "fr-FR") return "fr-FR";
  if (value === "en-US") return "en-US";
  return "ar-SA";
};

const normalizeAudioSilenceTimeoutSec = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 15;
  return Math.max(15, Math.min(120, Math.floor(value)));
};

const normalizeAudioTranscriptClearDelaySec = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 3;
  return Math.max(0, Math.min(15, Math.floor(value)));
};

const normalizeBlurActionControlsWhileListening = (value: unknown): boolean => {
  if (typeof value !== "boolean") return false;
  return value;
};

const normalizeChipTextFormat = (value: unknown): ChipTextFormat => {
  if (value === "arabic") return "arabic";
  if (value === "both") return "both";
  return "transliteration";
};

const normalizeBooleanWithDefault = (value: unknown, fallback: boolean): boolean => {
  if (typeof value !== "boolean") return fallback;
  return value;
};

const normalizeTheme = (value: unknown): Theme => {
  if (value === "light") return "light";
  if (value === "dark") return "dark";
  if (value === "blue") return "blue";
  return "blue";
};

const resolveStoredTheme = (preferences: unknown): Theme => {
  if (preferences && typeof preferences === "object") {
    const prefs = preferences as { theme?: unknown; darkMode?: unknown };
    if (prefs.theme !== undefined) {
      return normalizeTheme(prefs.theme);
    }
    if (typeof prefs.darkMode === "boolean") {
      return prefs.darkMode ? "dark" : "blue";
    }
  }
  return "blue";
};

const resolveStoredWakeLockEnabled = (preferences: unknown): boolean => {
  if (!preferences || typeof preferences !== "object") return false;
  const prefs = preferences as { wakeLockEnabled?: unknown };
  return typeof prefs.wakeLockEnabled === "boolean" ? prefs.wakeLockEnabled : false;
};

const baseInitialState = getInitialState();
const storedState = loadStateFromStorage();
const normalizedStoredActiveListId =
  typeof storedState?.activeListId === "string"
    ? normalizeListId(storedState.activeListId)
    : undefined;

const initialState: Partial<TasbihStoreState> = {
  ...baseInitialState,
  ...storedState,
  activeListId: normalizedStoredActiveListId ?? baseInitialState.activeListId,
  preferences: {
    ...baseInitialState.preferences,
    ...storedState?.preferences,
    theme: resolveStoredTheme(storedState?.preferences),
    wakeLockEnabled: resolveStoredWakeLockEnabled(storedState?.preferences),
    tapSound: normalizeTapSound(storedState?.preferences?.tapSound),
    speechTolerance: normalizeSpeechTolerance(storedState?.preferences?.speechTolerance),
    speechRecognitionLanguage: normalizeSpeechRecognitionLanguage(
      storedState?.preferences?.speechRecognitionLanguage
    ),
    audioSilenceTimeoutSec: normalizeAudioSilenceTimeoutSec(
      storedState?.preferences?.audioSilenceTimeoutSec
    ),
    audioTranscriptClearDelaySec: normalizeAudioTranscriptClearDelaySec(
      storedState?.preferences?.audioTranscriptClearDelaySec
    ),
    blurActionControlsWhileListening: normalizeBlurActionControlsWhileListening(
      storedState?.preferences?.blurActionControlsWhileListening
    ),
    chipTextFormat: normalizeChipTextFormat(storedState?.preferences?.chipTextFormat),
    audioClearTranscriptOnSilence: normalizeBooleanWithDefault(
      storedState?.preferences?.audioClearTranscriptOnSilence,
      true
    ),
    audioStopOnSilence: normalizeBooleanWithDefault(
      storedState?.preferences?.audioStopOnSilence,
      true
    ),
    audioDebugTelemetry: normalizeBooleanWithDefault(
      storedState?.preferences?.audioDebugTelemetry,
      false
    ),
  } as Preferences,
};

const resolveZikr = (
  zikrId: string,
  customZikrs: Record<string, Zikr> = {}
): Zikr | undefined => {
  return customZikrs[zikrId] ?? zikrs.find((d) => d.id === zikrId);
};

const pruneOrphanCustomZikrs = (
  customZikrs: Record<string, Zikr>,
  customLists: Record<string, string[]>
): Record<string, Zikr> => {
  const referencedZikrIds = new Set(Object.values(customLists).flat());
  const nextCustomZikrs: Record<string, Zikr> = {};

  Object.entries(customZikrs).forEach(([zikrId, zikr]) => {
    if (referencedZikrIds.has(zikrId)) {
      nextCustomZikrs[zikrId] = zikr;
    }
  });

  return nextCustomZikrs;
};

const createStore = () =>
  create<TasbihStoreState>()(
    devtools((set) => ({
      ...initialState,
      currentZikr: resolveZikr(initialState.currentZikrId ?? "", initialState.customZikrs ?? {}),
      setLanguage: (lang: "fr" | "en") =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              language: lang,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),
        increment: () => 
          set((state) => {
            const target = state.customTarget ?? state.currentZikr?.defaultTarget ?? 0;
            const initial = initialCounterForMode(state.mode, target);
            const next = isDownMode(state.mode) ? state.counter - 1 : state.counter + 1;
            const bounded = Math.max(0, Math.min(target, next));

            if (bounded === state.counter) {
              return state;
            }

            const goalReached = isDownMode(state.mode) ? bounded === 0 : bounded === target;
            const isStarted = bounded !== initial && !goalReached;

            const startedSession = state.currentSessionCount > 0;
            const startAt = startedSession ? state.sessionStartAt : new Date().toISOString();

            const newState = {
              counter: bounded,
              isStarted,
              currentSessionCount: state.currentSessionCount + 1,
              sessionStartAt: startAt,
              stats: {
                ...state.stats,
                totalZikr: state.stats.totalZikr + 1,
              },
            };
            persistState({
              ...state,
              ...newState,
            });
            return newState;
          }),
        decrement: () =>
          set((state) => {
          const target = state.customTarget ?? state.currentZikr?.defaultTarget ?? 0;
          const initial = initialCounterForMode(state.mode, target);
          const next = isDownMode(state.mode) ? state.counter + 1 : state.counter - 1;
          const bounded = Math.max(0, Math.min(target, next));

          if (bounded === state.counter) {
            return state;
          }

          const goalReached = isDownMode(state.mode) ? bounded === 0 : bounded === target;
          const isStarted = bounded !== initial && !goalReached;

          const newState = {
            counter: bounded,
            isStarted,
            stats: {
              ...state.stats,
              totalZikr: Math.max(0, state.stats.totalZikr - 1),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      reset: () =>
        set((state) => {
          const endAt = new Date().toISOString();
          const sessionCount = state.currentSessionCount;
          const historyEntry =
            sessionCount > 0
              ? {
                  id: `${state.sessionStartAt ?? endAt}-${state.currentZikrId}`,
                  startAt: state.sessionStartAt ?? endAt,
                  endAt,
                  zikrCount: sessionCount,
                  listId: state.activeListId,
                  zikrId: state.currentZikrId,
                }
              : undefined;

          const nextHistory = historyEntry
            ? [historyEntry, ...state.stats.history].slice(0, 100)
            : state.stats.history;

          const uniqueDays = new Set<string>(
            nextHistory.map((entry) => entry.startAt.slice(0, 10))
          );

          const target = state.customTarget ?? state.currentZikr?.defaultTarget ?? 0;
          const initial = initialCounterForMode(state.mode, target);

          const newState: Partial<TasbihStoreState> = {
            counter: initial,
            isStarted: false,
            currentSessionCount: 0,
            sessionStartAt: undefined,
            stats: {
              ...state.stats,
              sessions: historyEntry ? state.stats.sessions + 1 : state.stats.sessions,
              history: nextHistory,
              activeDays: uniqueDays.size,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      undoLast: () =>
        set((state) => {
          // undo will decrement totalZikr and reverse counter by one step
          const target = state.customTarget ?? state.currentZikr?.defaultTarget ?? 0;
          const direction = isDownMode(state.mode) ? 1 : -1;
          const next = state.counter + direction;
          const bounded = Math.max(0, Math.min(target, next));

          if (bounded === state.counter) {
            return state;
          }

          const initial = initialCounterForMode(state.mode, target);
          const newTotal = Math.max(0, state.stats.totalZikr - 1);
          const newState = {
            counter: bounded,
            isStarted: bounded !== initial,
            stats: {
              ...state.stats,
              totalZikr: newTotal,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

        previousZikrInList: () =>
          set((state) => {
            if (state.activeIndex <= 0) return state;
            const prevIndex = state.activeIndex - 1;
            const prevZikrId = state.activeList[prevIndex] ?? state.currentZikrId;
            const prevZikr = resolveZikr(prevZikrId, state.customZikrs);
            const target = prevZikr?.defaultTarget ?? 0;
            const resetOnPrev = state.preferences.resetOnPrev ?? true;
            // Snapshot current counter before leaving
            const updatedProgress = {
              ...state.listProgress,
              [state.activeIndex]: state.counter,
            };
            // Restore saved progress for prev zikr if setting is off, else reset
            const restoredCounter = !resetOnPrev && updatedProgress[prevIndex] !== undefined
              ? updatedProgress[prevIndex]
              : initialCounterForMode(state.mode, target);
            const newState = {
              activeIndex: prevIndex,
              currentZikrId: prevZikrId,
              currentZikr: prevZikr,
              customTarget: undefined,
              counter: restoredCounter,
              isStarted: false,
              listProgress: updatedProgress,
            };
            persistState({
              ...state,
              ...newState,
            });
            return newState;
          }),

        nextZikrInList: () =>
          set((state) => {
            if (state.activeIndex >= state.activeList.length - 1) return state;
            const nextIndex = state.activeIndex + 1;
            const nextZikrId = state.activeList[nextIndex] ?? state.currentZikrId;
            const nextZikr = resolveZikr(nextZikrId, state.customZikrs);
            const target = nextZikr?.defaultTarget ?? 0;
            // Snapshot current counter before moving forward
            const updatedProgress = {
              ...state.listProgress,
              [state.activeIndex]: state.counter,
            };
            const newState = {
              activeIndex: nextIndex,
              currentZikrId: nextZikrId,
              currentZikr: nextZikr,
              customTarget: undefined,
              counter: initialCounterForMode(state.mode, target),
              isStarted: false,
              listProgress: updatedProgress,
            };
            persistState({
              ...state,
              ...newState,
            });
            return newState;
          }),

      selectZikrAsList: (zikrId: string) =>
        set((state) => {
          const zikr = resolveZikr(zikrId, state.customZikrs);
          const target = zikr?.defaultTarget ?? 0;
          const listLabel = zikr?.transliteration || zikrId;
          const newState = {
            activeListId: listLabel,
            activeList: [zikrId],
            activeIndex: 0,
            currentZikrId: zikrId,
            currentZikr: zikr,
            customTarget: undefined,
            counter: initialCounterForMode(state.mode, target),
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      selectRoutine: (label: string, zikrIds: string[]) =>
        set((state) => {
          const list = zikrIds.filter((zikrId) => resolveZikr(zikrId, state.customZikrs));
          const firstId = list[0] ?? state.currentZikrId;
          const firstZikr = resolveZikr(firstId, state.customZikrs);
          const target = firstZikr?.defaultTarget ?? 0;
          const newState = {
            activeListId: label,
            activeList: list,
            activeIndex: 0,
            currentZikrId: firstId,
            currentZikr: firstZikr,
            customTarget: undefined,
            counter: initialCounterForMode(state.mode, target),
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      selectList: (listId: string) =>
        set((state) => {
          const normalizedListId = normalizeListId(listId);
          const lists = {
            ...predefinedLists,
            ...state.customLists,
          } as Record<string, string[]>;

          // Support selecting a group/category from the dropdown
          const groupList = zikrs
            .filter((d) => d.category === normalizedListId)
            .map((d) => d.id);

          const list = lists[normalizedListId] ?? groupList ?? [];
          const firstId = list[0] ?? state.currentZikrId;
          const firstZikr = resolveZikr(firstId, state.customZikrs);
          const target = firstZikr?.defaultTarget ?? 0;
          const newState = {
            activeListId: normalizedListId,
            activeList: list,
            activeIndex: 0,
            currentZikrId: firstId,
            currentZikr: firstZikr,
            customTarget: undefined,
            counter: initialCounterForMode(state.mode, target),
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      upsertCustomZikr: (zikr: Zikr) =>
        set((state) => {
          const newState = {
            customZikrs: {
              ...state.customZikrs,
              [zikr.id]: zikr,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      createList: (listName: string) =>
        set((state) => {
          if (!listName.trim()) return state;
          if (state.customLists[listName]) return state;

          const newState = {
            customLists: {
              ...state.customLists,
              [listName]: [],
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      deleteList: (listId: string) =>
        set((state) => {
          const nextCustomLists = { ...state.customLists };
          delete nextCustomLists[listId];

          const nextCustomZikrs = pruneOrphanCustomZikrs(
            state.customZikrs,
            nextCustomLists
          );

          const isActive = state.activeListId === listId;
          const newState: Partial<TasbihStoreState> = {
            customLists: nextCustomLists,
            customZikrs: nextCustomZikrs,
          };
          if (isActive) {
            newState.activeListId = DEFAULT_LIST_ID;
            newState.activeList = predefinedLists[DEFAULT_LIST_ID];
            newState.activeIndex = 0;
            newState.currentZikrId = predefinedLists[DEFAULT_LIST_ID][0];
            newState.currentZikr = resolveZikr(predefinedLists[DEFAULT_LIST_ID][0], state.customZikrs);
            newState.customTarget = undefined;
          }
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      renameList: (oldId: string, newId: string) =>
        set((state) => {
          if (!newId.trim()) return state;
          if (oldId === newId) return state;
          if (state.customLists[newId]) return state;

          const next = { ...state.customLists };
          next[newId] = next[oldId] ?? [];
          delete next[oldId];

          const newState: Partial<TasbihStoreState> = {
            customLists: next,
          };
          if (state.activeListId === oldId) {
            newState.activeListId = newId;
          }

          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      addToList: (listId: string, zikrId: string) =>
        set((state) => {
          const list = state.customLists[listId] ?? [];
          if (list.includes(zikrId)) return state;
          const next = {
            ...state.customLists,
            [listId]: [...list, zikrId],
          };
          const newState = { customLists: next };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      removeFromList: (listId: string, zikrId: string) =>
        set((state) => {
          const list = state.customLists[listId] ?? [];
          const nextCustomLists = {
            ...state.customLists,
            [listId]: list.filter((id) => id !== zikrId),
          };

          const nextCustomZikrs = pruneOrphanCustomZikrs(
            state.customZikrs,
            nextCustomLists
          );

          const newState = {
            customLists: nextCustomLists,
            customZikrs: nextCustomZikrs,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      moveInList: (listId: string, fromIndex: number, toIndex: number) =>
        set((state) => {
          const list = state.customLists[listId] ?? [];
          if (fromIndex < 0 || fromIndex >= list.length) return state;
          if (toIndex < 0 || toIndex >= list.length) return state;
          const next = [...list];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          const newState = {
            customLists: {
              ...state.customLists,
              [listId]: next,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      reorderLists: (fromId: string, toId: string) =>
        set((state) => {
          const entries = Object.entries(state.customLists);
          const fromIndex = entries.findIndex(([id]) => id === fromId);
          const toIndex = entries.findIndex(([id]) => id === toId);
          if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return state;
          const next = [...entries];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          const newState = { customLists: Object.fromEntries(next) };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setCustomTarget: (target?: number) =>
        set((state) => {
          const parsed =
            typeof target === "number" && Number.isFinite(target)
              ? Math.max(1, Math.floor(target))
              : undefined;
          const effectiveTarget = parsed ?? state.currentZikr?.defaultTarget ?? 0;
          const initial = initialCounterForMode(state.mode, effectiveTarget);
          const nextCounter = state.isStarted
            ? Math.max(0, Math.min(state.counter, effectiveTarget))
            : initial;

          const newState = {
            customTarget: parsed,
            counter: nextCounter,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      toggleMode: () =>
        set((state) => {
          const currentIndex = MODE_SEQUENCE.indexOf(state.mode);
          const safeIndex = currentIndex === -1 ? 0 : currentIndex;
          const nextMode: Mode = MODE_SEQUENCE[(safeIndex + 1) % MODE_SEQUENCE.length];
          const target = state.customTarget ?? state.currentZikr?.defaultTarget ?? 0;
          const switchesDirection = isDownMode(state.mode) !== isDownMode(nextMode);
          const nextCounterRaw = switchesDirection ? target - state.counter : state.counter;
          const nextCounter = Math.max(0, Math.min(target, nextCounterRaw));
          const initial = initialCounterForMode(nextMode, target);
          const goalReached = isDownMode(nextMode) ? nextCounter === 0 : nextCounter === target;
          const newState: Partial<TasbihStoreState> = {
            mode: nextMode,
            counter: nextCounter,
            isStarted: nextCounter !== initial && !goalReached,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setTheme: (theme: Theme) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              theme: normalizeTheme(theme),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setIconTheme: (iconTheme: IconTheme) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              iconTheme,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      toggleVibration: () =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              vibration: !state.preferences.vibration,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setWakeLockEnabled: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              wakeLockEnabled: enabled,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      toggleConfetti: () =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              confetti: !state.preferences.confetti,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setTapSound: (sound: TapSound) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              tapSound: normalizeTapSound(sound),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setSpeechTolerance: (tolerance: SpeechTolerance) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              speechTolerance: normalizeSpeechTolerance(tolerance),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setSpeechRecognitionLanguage: (language: SpeechRecognitionLanguage) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              speechRecognitionLanguage: normalizeSpeechRecognitionLanguage(language),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAudioSilenceTimeoutSec: (seconds: number) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              audioSilenceTimeoutSec: normalizeAudioSilenceTimeoutSec(seconds),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAudioTranscriptClearDelaySec: (seconds: number) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              audioTranscriptClearDelaySec: normalizeAudioTranscriptClearDelaySec(seconds),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setBlurActionControlsWhileListening: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              blurActionControlsWhileListening: enabled,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setChipTextFormat: (format: ChipTextFormat) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              chipTextFormat: normalizeChipTextFormat(format),
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAudioClearTranscriptOnSilence: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              audioClearTranscriptOnSilence: enabled,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAudioStopOnSilence: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              audioStopOnSilence: enabled,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setResetOnPrev: (value: boolean) =>
        set((state) => {
          const newState = {
            preferences: { ...state.preferences, resetOnPrev: value },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      clearListProgress: () =>
        set((state) => {
          const newState = { listProgress: {} };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoAdvanceNextZikr: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoAdvanceNextZikr: enabled,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAutoCounterDefaultEnabled: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterDefaultEnabled: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterDefaultSpeed: (speed: number) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterDefaultSpeed: speed,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterResumeAfterReset: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterResumeAfterReset: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterStopAtGoal: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterStopAtGoal: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterEntryAutoStart: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterEntryAutoStart: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setBlurActionControlsWhileAuto: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              blurActionControlsWhileAuto: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterConfirmOnStop: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterConfirmOnStop: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterSoundOnTick: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterSoundOnTick: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),

      setAutoCounterVibrateOnTick: (enabled: boolean) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              autoCounterVibrateOnTick: enabled,
            },
          };
          persistState({ ...state, ...newState });
          return newState;
        }),


      resetPreferences: () =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              theme: "light" as Theme,
              vibration: false,
              wakeLockEnabled: false,
              tapSound: "off" as TapSound,
              speechTolerance: "balanced" as SpeechTolerance,
              speechRecognitionLanguage: "ar-SA" as SpeechRecognitionLanguage,
              audioSilenceTimeoutSec: 15,
              audioTranscriptClearDelaySec: 3,
              blurActionControlsWhileListening: false,
              chipTextFormat: "transliteration" as ChipTextFormat,
              audioClearTranscriptOnSilence: true,
              audioStopOnSilence: true,
              audioDebugTelemetry: false,
              language: "en" as const,
              confetti: false,
              remindersEnabled: false,
              reminderScheduleType: "daily" as ReminderScheduleType,
              reminderTimes: [] as ReminderTime[],
              reminderDays: [] as number[],
              optionalSyncEnabled: false,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setAdvancedTiming: (config: AdvancedTimingConfig) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              advancedTiming: config,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      createCustomProfile: (profile: Omit<CustomToleranceProfile, "id">) =>
        set((state) => {
          const id = `custom-${Date.now()}`;
          const customProfile: CustomToleranceProfile = { ...profile, id };
          const customProfiles = [...(state.preferences.customProfiles ?? []), customProfile];
          const newState = {
            preferences: {
              ...state.preferences,
              customProfiles,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      updateCustomProfile: (id: string, profile: Omit<CustomToleranceProfile, "id">) =>
        set((state) => {
          const customProfiles = (state.preferences.customProfiles ?? []).map((p) =>
            p.id === id ? { ...profile, id } : p
          );
          const newState = {
            preferences: {
              ...state.preferences,
              customProfiles,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      deleteCustomProfile: (id: string) =>
        set((state) => {
          const customProfiles = (state.preferences.customProfiles ?? []).filter((p) => p.id !== id);
          const activeCustomProfileId =
            state.preferences.activeCustomProfileId === id
              ? undefined
              : state.preferences.activeCustomProfileId;
          const newState = {
            preferences: {
              ...state.preferences,
              customProfiles,
              activeCustomProfileId,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setActiveCustomProfile: (id: string | undefined) =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              activeCustomProfileId: id,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      setListesUI: (update) =>
        set((state) => {
          const newState = {
            listesUI: { ...state.listesUI, ...update },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      resetStats: () =>
        set((state) => {
          const newState = {
            stats: {
              totalZikr: 0,
              sessions: 0,
              activeDays: 0,
              history: [],
            },
            currentSessionCount: 0,
            sessionStartAt: undefined,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),
    }))
  );

export const useTasbihStore = createStore();
