"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useTasbihStore } from "../store/tasbihStore";
import { dhikrs } from "../data/dhikrs";
import { CircleProgress } from "../components/CircleProgress";
import { BottomNav } from "../components/BottomNav";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentDhikr = useTasbihStore((s) => s.currentDhikr);
  const counter = useTasbihStore((s) => s.counter);
  const mode = useTasbihStore((s) => s.mode);
  const isStarted = useTasbihStore((s) => s.isStarted);
  const increment = useTasbihStore((s) => s.increment);
  const reset = useTasbihStore((s) => s.reset);
  const undoLast = useTasbihStore((s) => s.undoLast);
  const selectDhikr = useTasbihStore((s) => s.selectDhikr);
  const customLists = useTasbihStore((s) => s.customLists);

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const prevIsCompleted = useRef(false);

  const target = currentDhikr?.defaultTarget ?? 0;
  const [customTarget, setCustomTarget] = useState(target);

  const activeListId = useTasbihStore((s) => s.activeListId);
  const activeList = useTasbihStore((s) => s.activeList);
  const activeIndex = useTasbihStore((s) => s.activeIndex);
  const nextDhikrInList = useTasbihStore((s) => s.nextDhikrInList);
  const selectList = useTasbihStore((s) => s.selectList);

  const [ignoreList, setIgnoreList] = useState(false);

  const isListMode =
    !ignoreList && activeListId !== "Zikr de base" && activeList.length > 0;

  useEffect(() => {
    if (!isListMode) {
      setCustomTarget(target);
    }
  }, [target, isListMode]);

  const effectiveTarget = isListMode ? target : customTarget;
  const isCompleted =
    mode === "up" ? counter >= effectiveTarget && effectiveTarget > 0 : counter <= 0;

  const handleIncrement = () => {
    increment();
    setPulseTrigger((t) => t + 1);
  };

  const handleQuitList = () => {
    setIgnoreList(true);
    selectList("Zikr de base");
    reset();
  };

  useEffect(() => {
    if (isCompleted && !prevIsCompleted.current) {
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dropdownOpen) setSearchQuery("");
  }, [dropdownOpen]);

  const listPosition = `${activeIndex + 1} / ${activeList.length}`;
  const isListComplete =
    isListMode && isCompleted && activeIndex === activeList.length - 1;

  useEffect(() => {
    setIgnoreList(false);
  }, [activeListId]);

  useEffect(() => {
    if (!isListComplete) return;

    setShowListCompleteToast(true);
    const timer = window.setTimeout(() => {
      setShowListCompleteToast(false);
      setIgnoreList(true);
      selectList("Zikr de base");
      reset();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isListComplete, selectList, reset]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!dropdownOpen) return;
      if (!dropdownRef.current) return;
      if (event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  if (!mounted) return null;

  const renderCompteur = () => (
    <div className="flex flex-col gap-6 px-5 pb-28 pt-6">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-white">🌙 Tasbih Digital</h1>
        <p className="text-sm text-gray-400">Compteur de dhikr</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className="flex w-full flex-col rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-left text-white outline-none transition focus:border-[#F5A623]"
          >
            {isListMode ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      ≡ {activeListId}
                    </span>
                    <span className="rounded-full bg-[#F5A623] px-2 py-0.5 text-[10px] font-semibold text-black">
                      Sélection
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{dropdownOpen ? "▴" : "▾"}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {formatZikrCount(activeList.length)}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">Tous les Zikr</span>
                </div>
                <span className="ml-2 text-sm text-gray-400">
                  {dropdownOpen ? "▴" : "▾"}
                </span>
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="mt-2 max-h-[60vh] w-full overflow-y-auto rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] py-2">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-sm font-semibold text-white">
                  {isListMode
                    ? `≡ ${activeListId} — ${formatZikrCount(activeList.length)}`
                    : "Tous les Zikr"}
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-gray-400 hover:bg-white/10"
                  onClick={() => setDropdownOpen(false)}
                  aria-label="Fermer"
                >
                  ∧
                </button>
              </div>

              <div className="px-4 pb-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un zikr ou une catégorie"
                  className="w-full rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[#666666]">
                BIBLIOTHÈQUE
              </div>

              {filteredGroupEntries.length === 0 &&
                Object.keys(filteredCustomLists).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    Aucun résultat trouvé
                  </div>
                )}

              {filteredGroupEntries.map(([category, items]) => {
                const expanded = isSearching ? true : expandedGroups[category] ?? false;
                return (
                  <div key={category} className="border-t border-[#2A2A2A]">
                    <div
                      role="button"
                      className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => {
                        selectList(category);
                        setIgnoreList(false);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="text-sm font-semibold text-[#F5A623]">
                        {highlightMatch(category)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatZikrCount(items.length)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedGroups((prev) => ({
                              ...prev,
                              [category]: !expanded,
                            }));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-gray-400 hover:bg-white/10"
                          aria-label={expanded ? "Réduire" : "Développer"}
                        >
                          {expanded ? "∨" : "›"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-1 px-6 pb-2">
                        {items.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-white hover:bg-[#2A2A2A]"
                            onClick={() => {
                              selectDhikr(d.id);
                              setIgnoreList(true);
                              setDropdownOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm truncate">{highlightMatch(d.arabic)}</span>
                              <span className="text-xs text-gray-400">{highlightMatch(d.transliteration)}</span>
                            </div>
                            <span className="text-xs text-gray-400">×{d.defaultTarget}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-[#666666]">
                LISTES PERSONNALISÉES
              </div>

              {Object.keys(filteredCustomLists).length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">Aucune liste créée</div>
              ) : (
                Object.entries(filteredCustomLists).map(([listId, ids]) => {
                  const expanded = isSearching ? true : expandedGroups[listId] ?? false;
                  const items = ids
                    .map((id) => dhikrs.find((d) => d.id === id))
                    .filter(Boolean) as typeof dhikrs;
                  return (
                    <div key={listId} className="border-t border-[#2A2A2A]">
                      <div
                        role="button"
                        className="flex items-center justify-between px-4 py-3 cursor-pointer"
                        onClick={() => {
                          selectList(listId);
                          setIgnoreList(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <span className="text-sm font-semibold text-[#F5A623]">
                          {highlightMatch(listId)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {formatZikrCount(items.length)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedGroups((prev) => ({
                                ...prev,
                                [listId]: !expanded,
                              }));
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-gray-400 hover:bg-white/10"
                            aria-label={expanded ? "Réduire" : "Développer"}
                          >
                            {expanded ? "∨" : "›"}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="space-y-1 px-6 pb-2">
                          {items.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-white hover:bg-[#2A2A2A]"
                              onClick={() => {
                                selectDhikr(d.id);
                                setIgnoreList(true);
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm truncate">{highlightMatch(d.arabic)}</span>
                                <span className="text-xs text-gray-400">{highlightMatch(d.transliteration)}</span>
                              </div>
                              <span className="text-xs text-gray-400">×{d.defaultTarget}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
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
          value={counter}
          target={effectiveTarget}
          mode={mode}
          isCompleted={isCompleted}
          pulseTrigger={pulseTrigger}
        />
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-400">OBJECTIF</div>
          {!isListMode ? (
            <input
              type="number"
              min={1}
              value={customTarget}
              onChange={(e) => setCustomTarget(Math.max(1, Number(e.target.value) || 1))}
              className="mx-auto w-28 rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
          ) : (
            <div className="text-2xl font-bold text-white">{target}</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <motion.button
          onClick={handleIncrement}
          disabled={isCompleted}
          whileTap={{ scale: 0.95 }}
          className={`w-full rounded-xl px-6 py-4 text-lg font-bold shadow-sm transition hover:brightness-110 ${
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
            className="w-full rounded-xl bg-[#22C55E] px-6 py-4 text-lg font-bold text-white transition hover:brightness-110"
          >
            Zikr suivant &gt;
          </button>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={undoLast}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
          >
            ↩ Undo
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
          >
            Reset
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
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {dhikr.transliteration}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-6 px-5 pb-28 pt-6">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            {activeListId}
          </div>
          <div className="text-sm font-semibold text-gray-400">{listPosition}</div>
        </header>

        <div className="flex flex-wrap gap-2 pb-2">
          {activeList.map((dhikrId, index) => renderChip(dhikrId, index))}
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
            className={`w-full rounded-xl px-6 py-4 text-lg font-bold shadow-sm transition hover:brightness-110 ${
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
              className="w-full rounded-xl bg-[#22C55E] px-6 py-4 text-lg font-bold text-white transition hover:brightness-110"
            >
              Zikr suivant &gt;
            </button>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={undoLast}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
            >
              ↩ Undo
            </button>
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
            >
              Reset
            </button>
          </div>

          <button
            onClick={handleQuitList}
            className="mt-3 text-center text-sm font-semibold text-gray-400 underline"
          >
            Quitter cette liste
          </button>
        </div>

        {showListCompleteToast && (
          <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Liste complète !
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <main className="mx-auto flex max-w-md flex-col pb-28">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isListMode ? renderListMode() : renderCompteur()}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
