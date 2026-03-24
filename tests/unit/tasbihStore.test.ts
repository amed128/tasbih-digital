import { beforeEach, describe, expect, it } from "vitest";
import { useTasbihStore } from "@/store/tasbihStore";

describe("tasbihStore boundary behavior", () => {
  beforeEach(() => {
    useTasbihStore.setState((state) => ({
      ...state,
      mode: "up",
      customTarget: 33,
      counter: 0,
      isStarted: false,
      currentSessionCount: 0,
      sessionStartAt: undefined,
      stats: {
        ...state.stats,
        totalZikr: 0,
        sessions: 0,
        activeDays: 0,
        history: [],
      },
    }));
  });

  it("does not increment stats/session when increment is already clamped at target", () => {
    useTasbihStore.setState((state) => ({
      ...state,
      mode: "auto",
      customTarget: 3,
      counter: 3,
      currentSessionCount: 7,
      sessionStartAt: "2026-03-23T09:00:00.000Z",
      stats: {
        ...state.stats,
        totalZikr: 12,
      },
    }));

    useTasbihStore.getState().increment();
    const next = useTasbihStore.getState();

    expect(next.counter).toBe(3);
    expect(next.currentSessionCount).toBe(7);
    expect(next.sessionStartAt).toBe("2026-03-23T09:00:00.000Z");
    expect(next.stats.totalZikr).toBe(12);
  });

  it("does not decrement total when undo is already clamped at initial", () => {
    useTasbihStore.setState((state) => ({
      ...state,
      mode: "up",
      customTarget: 33,
      counter: 0,
      stats: {
        ...state.stats,
        totalZikr: 5,
      },
    }));

    useTasbihStore.getState().undoLast();
    const next = useTasbihStore.getState();

    expect(next.counter).toBe(0);
    expect(next.stats.totalZikr).toBe(5);
  });

  it("does not decrement total when decrement is already clamped", () => {
    useTasbihStore.setState((state) => ({
      ...state,
      mode: "up",
      customTarget: 33,
      counter: 0,
      stats: {
        ...state.stats,
        totalZikr: 4,
      },
    }));

    useTasbihStore.getState().decrement();
    const next = useTasbihStore.getState();

    expect(next.counter).toBe(0);
    expect(next.stats.totalZikr).toBe(4);
  });

  it("does not increment stats when target resolves to zero", () => {
    useTasbihStore.setState((state) => ({
      ...state,
      mode: "auto",
      customTarget: undefined,
      currentZikr: undefined,
      counter: 0,
      currentSessionCount: 2,
      sessionStartAt: "2026-03-23T10:00:00.000Z",
      stats: {
        ...state.stats,
        totalZikr: 9,
      },
    }));

    useTasbihStore.getState().increment();
    const next = useTasbihStore.getState();

    expect(next.counter).toBe(0);
    expect(next.currentSessionCount).toBe(2);
    expect(next.sessionStartAt).toBe("2026-03-23T10:00:00.000Z");
    expect(next.stats.totalZikr).toBe(9);
  });
});
