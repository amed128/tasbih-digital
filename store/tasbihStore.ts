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
  darkMode: boolean;
  vibration: boolean;
  language: "fr" | "en";
};

export type TasbihStoreState = {
  // Current selected dhikr
  currentDhikrId: string;
  currentDhikr: Dhikr | undefined;
  // Counter
  counter: number;
  isStarted: boolean;
  mode: Mode;
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
  // Preferences
  preferences: Preferences;
  // Actions
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  undoLast: () => void;
  nextDhikrInList: () => void;
  selectDhikr: (dhikrId: string) => void;
  selectList: (listId: string) => void;
  toggleMode: () => void;
  resetStats: () => void;
  toggleDarkMode: () => void;
  toggleVibration: () => void;
  setLanguage: (lang: "fr" | "en") => void;
  createList: (listName: string) => void;
  deleteList: (listId: string) => void;
  renameList: (oldId: string, newId: string) => void;
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
    preferences: {
      darkMode: true,
      vibration: true,
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

const initialState = { ...getInitialState(), ...loadStateFromStorage() };

const resolveDhikr = (dhikrId: string): Dhikr | undefined => {
  return dhikrs.find((d) => d.id === dhikrId);
};

const createStore = () =>
  create<TasbihStoreState>()(
    devtools((set, get) => ({
      ...initialState,
      currentDhikr: resolveDhikr(initialState.currentDhikrId ?? ""),
      increment: () =>
        set((state) => {
          const target = state.currentDhikr?.defaultTarget ?? 0;
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
          const target = state.currentDhikr?.defaultTarget ?? 0;
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

          const target = state.currentDhikr?.defaultTarget ?? 0;
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
          const target = state.currentDhikr?.defaultTarget ?? 0;
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
          const nextDhikr = resolveDhikr(nextDhikrId);
          const target = nextDhikr?.defaultTarget ?? 0;
          const newState = {
            activeIndex: nextIndex,
            currentDhikrId: nextDhikrId,
            currentDhikr: nextDhikr,
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
          const dhikr = resolveDhikr(dhikrId);
          const target = dhikr?.defaultTarget ?? 0;
          const newState = {
            currentDhikrId: dhikrId,
            currentDhikr: dhikr,
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
          const list = lists[listId] ?? [];
          const firstId = list[0] ?? state.currentDhikrId;
          const firstDhikr = resolveDhikr(firstId);
          const target = firstDhikr?.defaultTarget ?? 0;
          const newState = {
            activeListId: listId,
            activeList: list,
            activeIndex: 0,
            currentDhikrId: firstId,
            currentDhikr: firstDhikr,
            counter: state.mode === "down" ? target : 0,
            isStarted: false,
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
          const next = { ...state.customLists };
          delete next[listId];
          const isActive = state.activeListId === listId;
          const newState: Partial<TasbihStoreState> = {
            customLists: next,
          };
          if (isActive) {
            newState.activeListId = "Zikr de base";
            newState.activeList = predefinedLists["Zikr de base"];
            newState.activeIndex = 0;
            newState.currentDhikrId = predefinedLists["Zikr de base"][0];
            newState.currentDhikr = resolveDhikr(predefinedLists["Zikr de base"][0]);
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
          const next = {
            ...state.customLists,
            [listId]: list.filter((id) => id !== dhikrId),
          };
          const newState = { customLists: next };
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

      toggleMode: () =>
        set((state) => {
          if (state.isStarted) return state;

          const nextMode: Mode = state.mode === "up" ? "down" : "up";
          const target = state.currentDhikr?.defaultTarget ?? 0;
          const newState: Partial<TasbihStoreState> = {
            mode: nextMode,
            counter: nextMode === "down" ? target : 0,
            isStarted: false,
          };
          persistState({
            ...state,
            ...newState,
          });
          return newState;
        }),

      toggleDarkMode: () =>
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              darkMode: !state.preferences.darkMode,
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
