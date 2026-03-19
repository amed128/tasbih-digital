"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useTasbihStore } from "../store/tasbihStore";
import { dhikrs } from "../data/dhikrs";
import { CircleProgress } from "../components/CircleProgress";
import { BottomNav } from "../components/BottomNav";
import { Modal } from "../components/Modal";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentDhikr = useTasbihStore((s) => s.currentDhikr);
  const counter = useTasbihStore((s) => s.counter);
  const isStarted = useTasbihStore((s) => s.isStarted);
  const mode = useTasbihStore((s) => s.mode);
  const vibrationEnabled = useTasbihStore((s) => s.preferences.vibration);
  const tapSound = useTasbihStore((s) => s.preferences.tapSound);
  const customTarget = useTasbihStore((s) => s.customTarget);
  const increment = useTasbihStore((s) => s.increment);
  const reset = useTasbihStore((s) => s.reset);
  const undoLast = useTasbihStore((s) => s.undoLast);
  const setCustomTarget = useTasbihStore((s) => s.setCustomTarget);
  const toggleMode = useTasbihStore((s) => s.toggleMode);
  const selectDhikrAsList = useTasbihStore((s) => s.selectDhikrAsList);
  const customLists = useTasbihStore((s) => s.customLists);

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const prevIsCompleted = useRef(false);

  const target = currentDhikr?.defaultTarget ?? 0;

  const activeListId = useTasbihStore((s) => s.activeListId);
  const activeList = useTasbihStore((s) => s.activeList);
  const activeIndex = useTasbihStore((s) => s.activeIndex);
  const nextDhikrInList = useTasbihStore((s) => s.nextDhikrInList);
  const selectList = useTasbihStore((s) => s.selectList);

  const [ignoreList, setIgnoreList] = useState(false);

  const isListMode =
    !ignoreList && activeListId !== "Zikr de base" && activeList.length > 0;

  const effectiveTarget = isListMode ? target : (customTarget ?? target);
  const isCompleted =
    mode === "up" ? counter >= effectiveTarget && effectiveTarget > 0 : counter <= 0;
  const isTargetLocked = !isListMode && isStarted && !isCompleted;

  const alignCurrentListChip = (behavior: ScrollBehavior = "smooth") => {
    if (!chipsContainerRef.current) return;

    const container = chipsContainerRef.current;
    const currentChip = container.querySelector<HTMLElement>(
      `[data-chip-index="${activeIndex}"]`
    );

    if (!currentChip) return;

    // Keep the active chip visible inside the mini scrollbar without moving the page.
    const containerRect = container.getBoundingClientRect();
    const chipRect = currentChip.getBoundingClientRect();
    const padding = 8;

    const chipTop = chipRect.top - containerRect.top + container.scrollTop;
    const chipBottom = chipRect.bottom - containerRect.top + container.scrollTop;
    const visibleTop = container.scrollTop;
    const visibleBottom = container.scrollTop + container.clientHeight;

    if (chipTop < visibleTop + padding) {
      const targetTop = Math.max(0, chipTop - padding);
      container.scrollTo({ top: targetTop, behavior });
      return;
    }

    if (chipBottom > visibleBottom - padding) {
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const targetTop = Math.min(maxScrollTop, chipBottom - container.clientHeight + padding);
      container.scrollTo({ top: targetTop, behavior });
    }
  };

  const scheduleAlignCurrentListChip = (behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => alignCurrentListChip(behavior));
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (!vibrationEnabled && tapSound === "off") return;
    if (typeof window === "undefined") return;

    // Hardware vibration where supported (typically Android/Chrome).
    if (vibrationEnabled && typeof window.navigator?.vibrate === "function") {
      window.navigator.vibrate(pattern);
    }

    if (tapSound === "off") return;

    const kind = Array.isArray(pattern) ? "complete" : "tap";

    const playTone = (
      ctx: AudioContext,
      startTime: number,
      frequency: number,
      duration: number,
      volume: number,
      type: OscillatorType
    ) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Audio fallback that works on iOS PWAs after a direct tap.
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;

      if (tapSound === "tap-soft") {
        playTone(ctx, now, 880, 0.014, 0.05, "sine");
        if (kind === "complete") {
          playTone(ctx, now + 0.06, 980, 0.02, 0.05, "sine");
        }
      } else if (tapSound === "button-click") {
        playTone(ctx, now, 540, 0.008, 0.04, "square");
        if (kind === "complete") {
          playTone(ctx, now + 0.05, 680, 0.008, 0.04, "square");
          playTone(ctx, now + 0.1, 820, 0.01, 0.04, "square");
        }
      } else {
        playTone(ctx, now, 220, 0.018, 0.055, "triangle");
        if (kind === "complete") {
          playTone(ctx, now + 0.055, 220, 0.02, 0.055, "triangle");
        }
      }
    } catch {
      // AudioContext unavailable — no-op
    }
  };

  const handleIncrement = () => {
    increment();
    triggerHaptic(18);
    setPulseTrigger((t) => t + 1);
  };

  const handleQuitList = () => {
    setIgnoreList(true);
    selectList("Zikr de base");
    reset();
  };

  useEffect(() => {
    if (isCompleted && !prevIsCompleted.current) {
      triggerHaptic([35, 40, 35]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#E4B15A", "#FFFFFF"],
      });
      setHasFiredConfetti(true);
    }

    if (!isCompleted) {
      setHasFiredConfetti(false);
    }

    prevIsCompleted.current = isCompleted;
  }, [isCompleted]);

  const [searchQuery, setSearchQuery] = useState("");

  const groupedDhikrs = useMemo(() => {
    const map = new Map<string, typeof dhikrs>();
    dhikrs.forEach((d) => {
      const list = map.get(d.category) ?? [];
      list.push(d);
      map.set(d.category, list);
    });
    return map;
  }, []);

  const formatZikrCount = (count: number) => `${count} Zikr${count === 1 ? "" : "s"}`;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;
  const matchesSearch = (value: string) =>
    value.toLowerCase().includes(normalizedSearch);

  const highlightMatch = (text: string) => {
    if (!isSearching) return text;
    const parts = text.split(new RegExp(`(${normalizedSearch})`, "gi"));
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === normalizedSearch ? (
            <span key={idx} className="rounded bg-[color:var(--primary)]/30 px-1 text-[var(--foreground)]">
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  };

  const filteredGroupEntries = useMemo(() => {
    if (!isSearching) return Array.from(groupedDhikrs.entries());

    return Array.from(groupedDhikrs.entries()).reduce<[string, typeof dhikrs][]>(
      (acc, [category, items]) => {
        const matchCategory = matchesSearch(category);
        const matchedItems = items.filter(
          (d) => matchesSearch(d.arabic) || matchesSearch(d.transliteration)
        );
        if (matchCategory || matchedItems.length > 0) {
          acc.push([category, matchCategory ? items : matchedItems]);
        }
        return acc;
      },
      []
    );
  }, [groupedDhikrs, normalizedSearch]);

  const filteredCustomLists = useMemo(() => {
    if (!isSearching) return customLists;

    return Object.entries(customLists).reduce<Record<string, string[]>>(
      (acc, [listId, ids]) => {
        const matchListId = matchesSearch(listId);
        const items = ids
          .map((id) => dhikrs.find((d) => d.id === id))
          .filter(Boolean) as typeof dhikrs;
        const matchedItems = items.filter(
          (d) => matchesSearch(d.arabic) || matchesSearch(d.transliteration)
        );
        if (matchListId || matchedItems.length > 0) {
          acc[listId] = matchListId ? ids : matchedItems.map((d) => d.id);
        }
        return acc;
      },
      {}
    );
  }, [customLists, normalizedSearch]);

  const [showListCompleteToast, setShowListCompleteToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [customListsExpanded, setCustomListsExpanded] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => () => { audioCtxRef.current?.close(); }, []);

  useEffect(() => {
    if (!dropdownOpen) setSearchQuery("");
  }, [dropdownOpen]);

  const listPosition = `${activeIndex + 1} / ${activeList.length}`;
  const isListComplete =
    isListMode && isCompleted && activeIndex === activeList.length - 1;
  const executionModeLabel = mode === "up" ? "Incrementation" : "Decrementation";
  const initialCounter = mode === "up" ? 0 : effectiveTarget;
  const hasProgressToReset = counter !== initialCounter || (isListMode && activeIndex > 0);

  const handleResetRequest = () => {
    if (!hasProgressToReset) {
      reset();
      return;
    }
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    reset();
    setShowResetConfirm(false);
  };

  useEffect(() => {
    setIgnoreList(false);
  }, [activeListId]);

  useEffect(() => {
    if (!isListComplete) return;

    setShowListCompleteToast(true);
    const timer = window.setTimeout(() => {
      setShowListCompleteToast(false);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [isListComplete]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!dropdownOpen) return;
      if (!dropdownRef.current) return;
      if (event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const keyHandler = (event: KeyboardEvent) => {
      if (!dropdownOpen) return;
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!isListMode) return;
    scheduleAlignCurrentListChip("smooth");
  }, [activeIndex, isListMode]);

  useEffect(() => {
    if (!isListMode) return;
    scheduleAlignCurrentListChip("auto");
  }, [pulseTrigger, isListMode]);

  if (!mounted) return null;

  const renderCompteur = () => (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">🌙 Tasbih Digital</h1>
        <p className="text-sm text-[var(--secondary)]">Compteur de Zikr</p>
        <button
          type="button"
          onClick={toggleMode}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition hover:border-[var(--primary)]"
          aria-label="Changer le mode d'execution"
        >
          Mode: {executionModeLabel}
        </button>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-expanded={dropdownOpen}
            aria-controls="zikr-selection-dropdown"
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left outline-none transition focus:border-[var(--primary)]"
          >
            <div className="min-w-0">
              {isListMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--foreground)]">≡ {activeListId}</span>
                    <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-black">
                      Sélection
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--secondary)]">
                    {formatZikrCount(activeList.length)}
                  </div>
                </>
              ) : (
                <span className="truncate text-sm font-semibold text-[var(--foreground)]">Tous les Zikr</span>
              )}
            </div>
            <span className="ml-3 text-lg text-[var(--secondary)]">{dropdownOpen ? "⌃" : "⌄"}</span>
          </button>

          {dropdownOpen && (
            <div
              id="zikr-selection-dropdown"
              role="region"
              aria-label="Selection de Zikr"
              className="mt-2 max-h-[60vh] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={(e) => setSearchQuery(e.target.value.trim())}
                  placeholder="Rechercher un Zikr ou une catégorie"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <button
                type="button"
                onClick={() => setLibraryExpanded(!libraryExpanded)}
                className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)] hover:bg-white/[0.03]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[0.78rem]">◫</span>
                  <span>BIBLIOTHÈQUE</span>
                </span>
                <span className="text-sm">{libraryExpanded ? "⌄" : "›"}</span>
              </button>

              {libraryExpanded && (
                <>
              {filteredGroupEntries.length === 0 &&
                Object.keys(filteredCustomLists).length === 0 && (
                  <div className="px-4 py-3 text-sm text-[var(--secondary)]">
                    Aucun résultat trouvé
                  </div>
                )}

              {filteredGroupEntries.map(([category, items]) => {
                const expanded = isSearching ? true : expandedGroups[category] ?? false;
                return (
                  <div key={category} className="border-b border-[var(--border)] last:border-b-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Selectionner ${category}`}
                      className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/[0.03]"
                      onClick={() => {
                        selectList(category);
                        setIgnoreList(false);
                        setDropdownOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        selectList(category);
                        setIgnoreList(false);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[var(--primary)]">
                          <span className="text-xs">☰</span>
                          <span className="truncate text-base font-semibold">
                            {highlightMatch(category)}
                          </span>
                        </div>
                        <span className="mt-0.5 block pl-5 text-sm text-[var(--secondary)]">
                          {formatZikrCount(items.length)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedGroups((prev) => ({
                              ...prev,
                              [category]: !expanded,
                            }));
                          }}
                          className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-base text-gray-500 hover:bg-white/5"
                          aria-label={expanded ? "Réduire" : "Développer"}
                        >
                          {expanded ? "⌄" : "›"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="pb-1">
                        {items.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="flex w-full min-w-0 items-start justify-between border-t border-[var(--border)] px-6 py-3 text-left text-[var(--foreground)] hover:bg-white/[0.03]"
                            onClick={() => {
                              selectDhikrAsList(d.id);
                              setIgnoreList(false);
                              setDropdownOpen(false);
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="truncate text-base leading-tight">{highlightMatch(d.arabic)}</span>
                              <span className="mt-0.5 block truncate text-sm text-gray-400">{highlightMatch(d.transliteration)}</span>
                            </div>
                            <span className="ml-3 w-14 flex-shrink-0 self-center text-right text-sm text-gray-500 tabular-nums">×{d.defaultTarget}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
                </>
              )}

              <button
                type="button"
                onClick={() => setCustomListsExpanded(!customListsExpanded)}
                className="flex w-full items-center justify-between border-b border-[#242424] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)] hover:bg-white/[0.03]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[0.78rem]">≡</span>
                  <span>LISTES PERSONNALISÉES</span>
                </span>
                <span className="text-sm">{customListsExpanded ? "⌄" : "›"}</span>
              </button>

              {customListsExpanded && (
                <>
              {Object.keys(filteredCustomLists).length === 0 ? (
                <div className="px-4 py-2 text-sm text-[var(--secondary)]">Aucune liste créée</div>
              ) : (
                Object.entries(filteredCustomLists).map(([listId, ids]) => {
                  const expanded = isSearching ? true : expandedGroups[listId] ?? false;
                  const items = ids
                    .map((id) => dhikrs.find((d) => d.id === id))
                    .filter(Boolean) as typeof dhikrs;
                  return (
                    <div key={listId} className="border-b border-[var(--border)] last:border-b-0">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Selectionner ${listId}`}
                        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/[0.03]"
                        onClick={() => {
                          selectList(listId);
                          setIgnoreList(false);
                          setDropdownOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          selectList(listId);
                          setIgnoreList(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[var(--primary)]">
                            <span className="text-xs">☰</span>
                            <span className="truncate text-base font-semibold">
                              {highlightMatch(listId)}
                            </span>
                          </div>
                          <span className="mt-0.5 block pl-5 text-sm text-[var(--secondary)]">
                            {formatZikrCount(items.length)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedGroups((prev) => ({
                                ...prev,
                                [listId]: !expanded,
                              }));
                            }}
                            className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-base text-gray-500 hover:bg-white/5"
                            aria-label={expanded ? "Réduire" : "Développer"}
                          >
                            {expanded ? "⌄" : "›"}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="pb-1">
                          {items.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="flex w-full min-w-0 items-start justify-between border-t border-[var(--border)] px-6 py-3 text-left text-[var(--foreground)] hover:bg-white/[0.03]"
                              onClick={() => {
                                selectDhikrAsList(d.id);
                                setIgnoreList(false);
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="truncate text-base leading-tight">{highlightMatch(d.arabic)}</span>
                                <span className="truncate text-sm text-[var(--secondary)]">{highlightMatch(d.transliteration)}</span>
                              </div>
                              <span className="ml-3 w-14 flex-shrink-0 self-center text-right text-sm text-[var(--secondary)] tabular-nums">×{d.defaultTarget}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
                </>
              )}
            </div>
          )}
        </div>

        {ignoreList && currentDhikr && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-black">
              {currentDhikr.transliteration}
            </span>
            <span className="rounded-full bg-[var(--border)] px-4 py-2 text-sm text-[var(--secondary)]">
              {currentDhikr.arabic}
            </span>
          </div>
        )}

      </div>

      <motion.div layout className="flex flex-col items-center gap-4">
        <CircleProgress
          value={counter}
          target={effectiveTarget}
          mode={mode}
          isCompleted={isCompleted}
          pulseTrigger={pulseTrigger}
        />
        <div className="text-center">
          <div className="text-sm font-semibold text-[var(--secondary)]">CIBLE</div>
          {!isListMode && !isCompleted ? (
            <input
              type="number"
              min={1}
              max={999}
              value={effectiveTarget}
              disabled={isTargetLocked}
              readOnly={isTargetLocked}
              onChange={(e) => {
                if (isTargetLocked) return;
                setCustomTarget(Math.max(1, Number(e.target.value) || 1));
              }}
              className={`mx-auto w-28 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-2xl font-bold text-[var(--foreground)] transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                isTargetLocked ? "cursor-not-allowed opacity-55 blur-[0.6px]" : ""
              }`}
            />
          ) : (
            <div className="text-2xl font-bold text-[var(--foreground)]">{effectiveTarget}</div>
          )}
        </div>
      </motion.div>

      <motion.div layout className="flex flex-col gap-3 pb-6">
        <motion.button
          onClick={handleIncrement}
          disabled={isCompleted}
          whileTap={{ scale: 0.95 }}
          animate={{
            backgroundColor: isCompleted ? "var(--card)" : "var(--primary)",
            color: isCompleted ? "#9CA3AF" : "#000000",
            opacity: isCompleted ? 0.55 : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`w-full rounded-xl px-6 py-5 text-lg font-bold shadow-sm transition hover:brightness-110 active:brightness-95 ${
            isCompleted ? "pointer-events-none cursor-not-allowed" : ""
          }`}
        >
          Appuyer
        </motion.button>

        <AnimatePresence>
          {isListMode && isCompleted && !isListComplete && (
            <motion.button
              onClick={nextDhikrInList}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
            >
              → Zikr suivant
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={undoLast}
            aria-label="Annuler la dernière action"
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
          >
            ↩ Annuler
          </button>
          <button
            onClick={handleResetRequest}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
          >
            Reinitialiser
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderListMode = () => {
    const currentDhikrInList = currentDhikr;

    const renderChip = (dhikrId: string, index: number) => {
      const dhikr = dhikrs.find((d) => d.id === dhikrId);
      if (!dhikr) return null;

      const isCurrent = index === activeIndex;
      const isDone = index < activeIndex || (isCurrent && isCompleted);

      const bgClass = isDone
        ? "bg-[#22C55E]"
        : isCurrent
        ? "bg-[var(--primary)]"
        : "bg-[var(--border)]";
      const textClass = isDone ? "text-white" : isCurrent ? "text-black" : "text-[var(--secondary)]" ;

      return (
        <div
          key={dhikrId}
          data-chip-index={index}
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {dhikr.transliteration}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-6 px-5 pt-6">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-[var(--secondary)]">
            {activeListId}
          </div>
          <div className="text-sm font-semibold text-[var(--secondary)]">{listPosition}</div>
        </header>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleMode}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition hover:border-[var(--primary)]"
            aria-label="Changer le mode d'execution"
          >
            Mode: {executionModeLabel}
          </button>
        </div>

        <div ref={chipsContainerRef} className="max-h-[104px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2 pb-2 pt-2">
          {activeList.map((dhikrId, index) => renderChip(dhikrId, index))}
          </div>
        </div>

        <motion.div layout className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-[2rem] font-bold text-[var(--primary)]">
              {currentDhikrInList?.transliteration}
            </div>
            <div className="mt-2 text-sm text-white">
              {currentDhikrInList?.arabic}
            </div>
          </div>

          <CircleProgress
            value={counter}
            target={effectiveTarget}
            mode={mode}
            isCompleted={isCompleted}
            pulseTrigger={pulseTrigger}
          />
        </motion.div>

        <motion.div layout className="flex flex-col gap-3">
          <motion.button
            onClick={handleIncrement}
            disabled={isCompleted}
            whileTap={{ scale: 0.95 }}
            animate={{
              backgroundColor: isCompleted ? "var(--card)" : "var(--primary)",
              color: isCompleted ? "#9CA3AF" : "#000000",
              opacity: isCompleted ? 0.55 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full rounded-xl px-6 py-5 text-lg font-bold shadow-sm transition hover:brightness-110 active:brightness-95 ${
              isCompleted ? "pointer-events-none cursor-not-allowed" : ""
            }`}
          >
            Appuyer
          </motion.button>

          <AnimatePresence>
            {isCompleted && !isListComplete && (
              <motion.button
                onClick={nextDhikrInList}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
              >
                → Zikr suivant
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={undoLast}
              aria-label="Annuler la dernière action"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
            >
              ↩ Annuler
            </button>
            <button
              onClick={handleResetRequest}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
            >
              Reinitialiser
            </button>
          </div>

          <button
            onClick={handleQuitList}
            className="mt-4 mb-4 self-center rounded-lg px-4 py-1.5 text-center text-sm font-semibold text-[var(--secondary)] underline"
          >
            ↩ Retour au compteur simple
          </button>
        </motion.div>

        {showListCompleteToast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Liste complète !
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-md flex-col pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isListMode ? renderListMode() : renderCompteur()}
        </motion.div>
      </main>

      <Modal
        isOpen={showResetConfirm}
        title="Reinitialiser le compteur ?"
        onClose={() => setShowResetConfirm(false)}
        closeOnOverlayClick={false}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Annuler
            </button>
            <button
              onClick={handleResetConfirm}
              className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white"
            >
              Reinitialiser
            </button>
          </div>
        }
      >
        <div className="text-sm text-[var(--secondary)]">
          Cette action remettra votre progression actuelle a zero.
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}
