"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  const mode = useTasbihStore((s) => s.mode);
  const vibrationEnabled = useTasbihStore((s) => s.preferences.vibration);
  const customTarget = useTasbihStore((s) => s.customTarget);
  const increment = useTasbihStore((s) => s.increment);
  const reset = useTasbihStore((s) => s.reset);
  const undoLast = useTasbihStore((s) => s.undoLast);
  const setCustomTarget = useTasbihStore((s) => s.setCustomTarget);
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
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => alignCurrentListChip(behavior));
    });
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (typeof window === "undefined") return;
    if (typeof window.navigator?.vibrate !== "function") return;
    window.navigator.vibrate(pattern);
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
        colors: ["#F5A623", "#FFFFFF"],
      });
      setHasFiredConfetti(true);
    }

    if (!isCompleted) {
      setHasFiredConfetti(false);
    }

    prevIsCompleted.current = isCompleted;
  }, [isCompleted, vibrationEnabled]);

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
            <span key={idx} className="rounded bg-[#F5A623]/30 px-1 text-white">
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
        <h1 className="text-xl font-semibold text-white">🌙 Tasbih Digital</h1>
        <p className="text-sm text-gray-400">Compteur de Zikr</p>
        <span className="rounded-full border border-[#2A2A2A] bg-[#151515] px-3 py-1 text-xs font-semibold text-[#F5A623]">
          Mode: {executionModeLabel}
        </span>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-expanded={dropdownOpen}
            aria-controls="zikr-selection-dropdown"
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between rounded-2xl border border-[#2A2A2A] bg-gradient-to-br from-[#1D1D1D] to-[#171717] px-4 py-3 text-left outline-none transition focus:border-[#F5A623]"
          >
            <div className="min-w-0">
              {isListMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">≡ {activeListId}</span>
                    <span className="rounded-full bg-[#F5A623] px-2 py-0.5 text-[10px] font-semibold text-black">
                      Sélection
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {formatZikrCount(activeList.length)}
                  </div>
                </>
              ) : (
                <span className="truncate text-sm font-semibold text-white">Tous les Zikr</span>
              )}
            </div>
            <span className="ml-3 text-lg text-gray-500">{dropdownOpen ? "⌃" : "⌄"}</span>
          </button>

          {dropdownOpen && (
            <div
              id="zikr-selection-dropdown"
              role="region"
              aria-label="Selection de Zikr"
              className="mt-2 max-h-[60vh] w-full overflow-y-auto rounded-2xl border border-[#2A2A2A] bg-gradient-to-b from-[#1B1B1B] to-[#151515] py-1 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-[#242424] px-4 py-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un Zikr ou une catégorie"
                  className="w-full rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <button
                type="button"
                onClick={() => setLibraryExpanded(!libraryExpanded)}
                className="flex w-full items-center justify-between border-b border-[#242424] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#666666] hover:bg-white/[0.03]"
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
                  <div className="px-4 py-3 text-sm text-gray-400">
                    Aucun résultat trouvé
                  </div>
                )}

              {filteredGroupEntries.map(([category, items]) => {
                const expanded = isSearching ? true : expandedGroups[category] ?? false;
                return (
                  <div key={category} className="border-b border-[#242424] last:border-b-0">
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
                        <div className="flex items-center gap-2 text-[#F5A623]">
                          <span className="text-xs">☰</span>
                          <span className="truncate text-base font-semibold">
                            {highlightMatch(category)}
                          </span>
                        </div>
                        <span className="mt-0.5 block pl-5 text-sm text-gray-400">
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
                            className="flex w-full items-start justify-between border-t border-[#232323] px-6 py-3 text-left text-white hover:bg-white/[0.03]"
                            onClick={() => {
                              selectDhikrAsList(d.id);
                              setIgnoreList(false);
                              setDropdownOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="truncate text-base leading-tight">{highlightMatch(d.arabic)}</span>
                              <span className="mt-0.5 truncate text-sm text-gray-400">{highlightMatch(d.transliteration)}</span>
                            </div>
                            <span className="pl-3 text-sm text-gray-500">×{d.defaultTarget}</span>
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
                className="flex w-full items-center justify-between border-b border-[#242424] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#666666] hover:bg-white/[0.03]"
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
                <div className="px-4 py-2 text-sm text-gray-500">Aucune liste créée</div>
              ) : (
                Object.entries(filteredCustomLists).map(([listId, ids]) => {
                  const expanded = isSearching ? true : expandedGroups[listId] ?? false;
                  const items = ids
                    .map((id) => dhikrs.find((d) => d.id === id))
                    .filter(Boolean) as typeof dhikrs;
                  return (
                    <div key={listId} className="border-b border-[#242424] last:border-b-0">
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
                          <div className="flex items-center gap-2 text-[#F5A623]">
                            <span className="text-xs">☰</span>
                            <span className="truncate text-base font-semibold">
                              {highlightMatch(listId)}
                            </span>
                          </div>
                          <span className="mt-0.5 block pl-5 text-sm text-gray-400">
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
                              className="flex w-full items-start justify-between border-t border-[#232323] px-6 py-3 text-left text-white hover:bg-white/[0.03]"
                              onClick={() => {
                                selectDhikrAsList(d.id);
                                setIgnoreList(false);
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="truncate text-base leading-tight">{highlightMatch(d.arabic)}</span>
                                <span className="mt-0.5 truncate text-sm text-gray-400">{highlightMatch(d.transliteration)}</span>
                              </div>
                              <span className="pl-3 text-sm text-gray-500">×{d.defaultTarget}</span>
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
            <span className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-semibold text-black">
              {currentDhikr.transliteration}
            </span>
            <span className="rounded-full bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300">
              {currentDhikr.arabic}
            </span>
          </div>
        )}

      </div>

      <div className="flex flex-col items-center gap-4">
        <CircleProgress
          key={`circle-${mode}-${effectiveTarget}-compteur`}
          value={counter}
          target={effectiveTarget}
          mode={mode}
          isCompleted={isCompleted}
          pulseTrigger={pulseTrigger}
        />
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-400">CIBLE</div>
          {!isListMode && !isCompleted ? (
            <input
              type="number"
              min={1}
              value={effectiveTarget}
              onChange={(e) => setCustomTarget(Math.max(1, Number(e.target.value) || 1))}
              className="mx-auto w-28 rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
          ) : (
            <div className="text-2xl font-bold text-white">{effectiveTarget}</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <motion.button
          onClick={handleIncrement}
          disabled={isCompleted}
          whileTap={{ scale: 0.95 }}
          className={`w-full rounded-xl px-6 py-5 text-lg font-bold shadow-sm transition hover:brightness-110 active:brightness-95 ${
            isCompleted
              ? "bg-[#1A1A1A] text-gray-400 opacity-50 pointer-events-none cursor-not-allowed"
              : "bg-[#F5A623] text-black"
          }`}
        >
          Appuyer
        </motion.button>

        {isListMode && isCompleted && !isListComplete && (
          <button
            onClick={nextDhikrInList}
            className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
          >
            → Zikr suivant
          </button>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={undoLast}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white transition hover:border-[#F5A623] active:brightness-95"
          >
            ↩ Annuler
          </button>
          <button
            onClick={handleResetRequest}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white transition hover:border-[#F5A623] active:brightness-95"
          >
            Reinitialiser
          </button>
        </div>
      </div>
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
        ? "bg-[#F5A623]"
        : "bg-[#2A2A2A]";
      const textClass = isDone ? "text-white" : isCurrent ? "text-black" : "text-[#666666]";

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
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            {activeListId}
          </div>
          <div className="text-sm font-semibold text-gray-400">{listPosition}</div>
        </header>

        <div className="flex justify-center">
          <span className="rounded-full border border-[#2A2A2A] bg-[#151515] px-3 py-1 text-xs font-semibold text-[#F5A623]">
            Mode: {executionModeLabel}
          </span>
        </div>

        <div ref={chipsContainerRef} className="max-h-[104px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2 pb-2 pt-2">
          {activeList.map((dhikrId, index) => renderChip(dhikrId, index))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-[2rem] font-bold text-[#F5A623]">
              {currentDhikrInList?.transliteration}
            </div>
            <div className="mt-2 text-sm text-white">
              {currentDhikrInList?.arabic}
            </div>
          </div>

          <CircleProgress
            key={`circle-${mode}-${target}-${activeListId}`}
            value={counter}
            target={effectiveTarget}
            mode={mode}
            isCompleted={isCompleted}
            pulseTrigger={pulseTrigger}
          />
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={handleIncrement}
            disabled={isCompleted}
            whileTap={{ scale: 0.95 }}
            className={`w-full rounded-xl px-6 py-5 text-lg font-bold shadow-sm transition hover:brightness-110 active:brightness-95 ${
              isCompleted
                ? "bg-[#1A1A1A] text-gray-400 opacity-50 pointer-events-none cursor-not-allowed"
                : "bg-[#F5A623] text-black"
            }`}
          >
            Appuyer
          </motion.button>

          {isCompleted && !isListComplete && (
            <button
              onClick={nextDhikrInList}
              className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
            >
              → Zikr suivant
            </button>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={undoLast}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white transition hover:border-[#F5A623] active:brightness-95"
            >
              ↩ Annuler
            </button>
            <button
              onClick={handleResetRequest}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white transition hover:border-[#F5A623] active:brightness-95"
            >
              Reinitialiser
            </button>
          </div>

          <button
            onClick={handleQuitList}
            className="mt-4 mb-4 self-center rounded-lg px-4 py-1.5 text-center text-sm font-semibold text-gray-400 underline"
          >
            ↩ Retour au compteur simple
          </button>
        </div>

        {showListCompleteToast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Liste complète !
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
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
        closeOnOverlayClick
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
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
        <div className="text-sm text-gray-200">
          Cette action remettra votre progression actuelle a zero.
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}
