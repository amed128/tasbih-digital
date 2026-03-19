import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { dhikrs, predefinedLists } from "../data/dhikrs";
import type { Dhikr } from "../data/dhikrs";

export type Mode = "up" | "down";

export type SessionRecord = {
  id: string;
  startAt: string; // ISO
  endAt?: string;
  dhikrCount: number;
  listId?: string;
  dhikrId?: string;
};

export type Stats = {
  totalDhikr: number;
  sessions: number;
  activeDays: number;
  history: SessionRecord[];
};

export type Preferences = {
  theme: Theme;
  vibration: boolean;
  tapSound: TapSound;
  language: "fr" | "en";
};

export type TapSound = "off" | "tap-soft" | "button-click" | "haptic-pulse";
export type Theme = "light" | "dark" | "blue";

export type TasbihStoreState = {
  // Current selected dhikr
  currentDhikrId: string;
  currentDhikr: Dhikr | undefined;
  // Counter
  counter: number;
  isStarted: boolean;
  mode: Mode;
  customTarget?: number;
  // Active list and index
  activeListId: string;
  activeList: string[];
  activeIndex: number;
  // Stats & history
  stats: Stats;
  currentSessionCount: number;
  sessionStartAt?: string;
  // Custom lists
  customLists: Record<string, string[]>;
  customDhikrs: Record<string, Dhikr>;
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
  decrement: () => void;
  reset: () => void;
  undoLast: () => void;
  nextDhikrInList: () => void;
  selectDhikr: (dhikrId: string) => void;
  selectDhikrAsList: (dhikrId: string) => void;
  selectList: (listId: string) => void;
  setCustomTarget: (target?: number) => void;
  toggleMode: () => void;
  setListesUI: (update: Partial<TasbihStoreState["listesUI"]>) => void;
  resetStats: () => void;
  setTheme: (theme: Theme) => void;
  toggleVibration: () => void;
  setTapSound: (sound: TapSound) => void;
  setLanguage: (lang: "fr" | "en") => void;
  createList: (listName: string) => void;
  deleteList: (listId: string) => void;
  renameList: (oldId: string, newId: string) => void;
  upsertCustomDhikr: (dhikr: Dhikr) => void;
  addToList: (listId: string, dhikrId: string) => void;
  removeFromList: (listId: string, dhikrId: string) => void;
  moveInList: (listId: string, fromIndex: number, toIndex: number) => void;
};

const STORAGE_KEY = "tasbihDigitalStateV1";

function getInitialState(): Partial<TasbihStoreState> {
  const listId = "Zikr de base";
  const list = predefinedLists[listId] ?? [];
  const firstDhikrId = list.length > 0 ? list[0] : "";

  return {
    currentDhikrId: firstDhikrId,
    currentDhikr: undefined,
    counter: 0,
    isStarted: false,
    mode: "up",
    customTarget: undefined,
    activeListId: listId,
    activeList: list,
    activeIndex: 0,
    stats: {
      totalDhikr: 0,
      sessions: 0,
      activeDays: 0,
      history: [],
    },
    currentSessionCount: 0,
    sessionStartAt: undefined,
    customLists: {},
    customDhikrs: {},
    listesUI: {
      libraryExpanded: true,
      expandedCategories: {},
      expandedLists: {},
    },
    preferences: {
      theme: "blue",
      vibration: true,
      tapSound: "tap-soft",
      language: "fr",
    },
  };
}

function loadStateFromStorage(): Partial<TasbihStoreState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TasbihStoreState>;
    return parsed;
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

const normalizeTapSound = (value: unknown): TapSound => {
  if (value === "off") return "off";
  if (value === "tap-soft") return "tap-soft";
  if (value === "button-click") return "button-click";
  if (value === "haptic-pulse") return "haptic-pulse";
  return "tap-soft";
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

const baseInitialState = getInitialState();
const storedState = loadStateFromStorage();

const initialState: Partial<TasbihStoreState> = {
  ...baseInitialState,
  ...storedState,
  preferences: {
    ...baseInitialState.preferences,
    ...storedState?.preferences,
    theme: resolveStoredTheme(storedState?.preferences),
    tapSound: normalizeTapSound(storedState?.preferences?.tapSound),
  } as Preferences,
};

const resolveDhikr = (
  dhikrId: string,
  customDhikrs: Record<string, Dhikr> = {}
): Dhikr | undefined => {
  return customDhikrs[dhikrId] ?? dhikrs.find((d) => d.id === dhikrId);
};

const pruneOrphanCustomDhikrs = (
  customDhikrs: Record<string, Dhikr>,
  customLists: Record<string, string[]>
): Record<string, Dhikr> => {
  const referencedDhikrIds = new Set(Object.values(customLists).flat());
  const nextCustomDhikrs: Record<string, Dhikr> = {};

  Object.entries(customDhikrs).forEach(([dhikrId, dhikr]) => {
    if (referencedDhikrIds.has(dhikrId)) {
      nextCustomDhikrs[dhikrId] = dhikr;
    }
  });

  return nextCustomDhikrs;
};

const createStore = () =>
  create<TasbihStoreState>()(
    devtools((set) => ({
      ...initialState,
      currentDhikr: resolveDhikr(initialState.currentDhikrId ?? "", initialState.customDhikrs ?? {}),
      increment: () =>
        set((state) => {
          const target = state.customTarget ?? state.currentDhikr?.defaultTarget ?? 0;
          const initial = state.mode === "up" ? 0 : target;
          const next = state.mode === "up" ? state.counter + 1 : state.counter - 1;
          const bounded = Math.max(0, Math.min(target, next));

          const goalReached = state.mode === "up" ? bounded === target : bounded === 0;
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
              totalDhikr: state.stats.totalDhikr + 1,
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
          const target = state.customTarget ?? state.currentDhikr?.defaultTarget ?? 0;
          const initial = state.mode === "up" ? 0 : target;
          const next = state.mode === "up" ? state.counter - 1 : state.counter + 1;
          const bounded = Math.max(0, Math.min(target, next));

          const goalReached = state.mode === "up" ? bounded === target : bounded === 0;
          const isStarted = bounded !== initial && !goalReached;

          const newState = {
            counter: bounded,
            isStarted,
            stats: {
              ...state.stats,
              totalDhikr: Math.max(0, state.stats.totalDhikr - 1),
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
                  id: `${state.sessionStartAt ?? endAt}-${state.currentDhikrId}`,
                  startAt: state.sessionStartAt ?? endAt,
                  endAt,
                  dhikrCount: sessionCount,
                  listId: state.activeListId,
                  dhikrId: state.currentDhikrId,
                }
              : undefined;

          const nextHistory = historyEntry
            ? [historyEntry, ...state.stats.history].slice(0, 100)
            : state.stats.history;

          const uniqueDays = new Set<string>(
            nextHistory.map((entry) => entry.startAt.slice(0, 10))
          );

          const target = state.customTarget ?? state.currentDhikr?.defaultTarget ?? 0;
          const initial = state.mode === "up" ? 0 : target;

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
          // undo will decrement totalDhikr and reverse counter by one step
          const target = state.customTarget ?? state.currentDhikr?.defaultTarget ?? 0;
          const direction = state.mode === "up" ? -1 : 1;
          const next = state.counter + direction;
          const bounded = Math.max(0, Math.min(target, next));
          const newTotal = Math.max(0, state.stats.totalDhikr - 1);
          const newState = {
            counter: bounded,
            stats: {
              ...state.stats,
              totalDhikr: newTotal,
            },
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      nextDhikrInList: () =>
        set((state) => {
          const nextIndex = Math.min(state.activeList.length - 1, state.activeIndex + 1);
          const nextDhikrId = state.activeList[nextIndex] ?? state.currentDhikrId;
          const nextDhikr = resolveDhikr(nextDhikrId, state.customDhikrs);
          const target = nextDhikr?.defaultTarget ?? 0;
          const newState = {
            activeIndex: nextIndex,
            currentDhikrId: nextDhikrId,
            currentDhikr: nextDhikr,
            customTarget: undefined,
            counter: state.mode === "down" ? target : 0,
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      selectDhikr: (dhikrId: string) =>
        set((state) => {
          const dhikr = resolveDhikr(dhikrId, state.customDhikrs);
          const target = dhikr?.defaultTarget ?? 0;
          const newState = {
            currentDhikrId: dhikrId,
            currentDhikr: dhikr,
            customTarget: undefined,
            counter: state.mode === "down" ? target : 0,
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      selectDhikrAsList: (dhikrId: string) =>
        set((state) => {
          const dhikr = resolveDhikr(dhikrId, state.customDhikrs);
          const target = dhikr?.defaultTarget ?? 0;
          const listLabel = dhikr?.transliteration || dhikrId;
          const newState = {
            activeListId: listLabel,
            activeList: [dhikrId],
            activeIndex: 0,
            currentDhikrId: dhikrId,
            currentDhikr: dhikr,
            customTarget: undefined,
            counter: state.mode === "down" ? target : 0,
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
          const lists = {
            ...predefinedLists,
            ...state.customLists,
          } as Record<string, string[]>;

          // Support selecting a group/category from the dropdown
          const groupList = dhikrs
            .filter((d) => d.category === listId)
            .map((d) => d.id);

          const list = lists[listId] ?? groupList ?? [];
          const firstId = list[0] ?? state.currentDhikrId;
          const firstDhikr = resolveDhikr(firstId, state.customDhikrs);
          const target = firstDhikr?.defaultTarget ?? 0;
          const newState = {
            activeListId: listId,
            activeList: list,
            activeIndex: 0,
            currentDhikrId: firstId,
            currentDhikr: firstDhikr,
            customTarget: undefined,
            counter: state.mode === "down" ? target : 0,
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      upsertCustomDhikr: (dhikr: Dhikr) =>
        set((state) => {
          const newState = {
            customDhikrs: {
              ...state.customDhikrs,
              [dhikr.id]: dhikr,
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

          const nextCustomDhikrs = pruneOrphanCustomDhikrs(
            state.customDhikrs,
            nextCustomLists
          );

          const isActive = state.activeListId === listId;
          const newState: Partial<TasbihStoreState> = {
            customLists: nextCustomLists,
            customDhikrs: nextCustomDhikrs,
          };
          if (isActive) {
            newState.activeListId = "Zikr de base";
            newState.activeList = predefinedLists["Zikr de base"];
            newState.activeIndex = 0;
            newState.currentDhikrId = predefinedLists["Zikr de base"][0];
            newState.currentDhikr = resolveDhikr(predefinedLists["Zikr de base"][0], state.customDhikrs);
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

      addToList: (listId: string, dhikrId: string) =>
        set((state) => {
          const list = state.customLists[listId] ?? [];
          if (list.includes(dhikrId)) return state;
          const next = {
            ...state.customLists,
            [listId]: [...list, dhikrId],
          };
          const newState = { customLists: next };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      removeFromList: (listId: string, dhikrId: string) =>
        set((state) => {
          const list = state.customLists[listId] ?? [];
          const nextCustomLists = {
            ...state.customLists,
            [listId]: list.filter((id) => id !== dhikrId),
          };

          const nextCustomDhikrs = pruneOrphanCustomDhikrs(
            state.customDhikrs,
            nextCustomLists
          );

          const newState = {
            customLists: nextCustomLists,
            customDhikrs: nextCustomDhikrs,
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

      setCustomTarget: (target?: number) =>
        set((state) => {
          const parsed =
            typeof target === "number" && Number.isFinite(target)
              ? Math.max(1, Math.floor(target))
              : undefined;
          const effectiveTarget = parsed ?? state.currentDhikr?.defaultTarget ?? 0;
          const initial = state.mode === "up" ? 0 : effectiveTarget;
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
          const nextMode: Mode = state.mode === "up" ? "down" : "up";
          const target = state.customTarget ?? state.currentDhikr?.defaultTarget ?? 0;
          const mirroredCounter = Math.max(0, Math.min(target, target - state.counter));
          const initial = nextMode === "up" ? 0 : target;
          const goalReached = nextMode === "up" ? mirroredCounter === target : mirroredCounter === 0;
          const newState: Partial<TasbihStoreState> = {
            mode: nextMode,
            counter: mirroredCounter,
            isStarted: mirroredCounter !== initial && !goalReached,
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
              totalDhikr: 0,
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
