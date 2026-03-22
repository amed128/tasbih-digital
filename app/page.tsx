"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useTasbihStore } from "../store/tasbihStore";
import { DEFAULT_LIST_ID, zikrs } from "../data/zikrs";
import { useT } from "@/hooks/useT";
import { CircleProgress } from "../components/CircleProgress";
import { BottomNav } from "../components/BottomNav";
import { Modal } from "../components/Modal";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};

type AudioAccessState = "idle" | "granted" | "denied" | "error" | "unsupported";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function normalizePronouncedText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWordForLooseMatch(word: string): string {
  return normalizePronouncedText(word).replace(/\s+/g, "");
}

function consonantSkeleton(word: string): string {
  return normalizeWordForLooseMatch(word)
    .replace(/[aeiouy]/g, "")
    .replace(/(.)\1+/g, "$1");
}

function wordsLooselyMatch(spokenWord: string, targetWord: string): boolean {
  const spoken = normalizeWordForLooseMatch(spokenWord);
  const target = normalizeWordForLooseMatch(targetWord);
  if (!spoken || !target) return false;

  if (spoken === target) return true;
  if (spoken.startsWith(target) || target.startsWith(spoken)) return true;

  const spokenSkeleton = consonantSkeleton(spoken);
  const targetSkeleton = consonantSkeleton(target);
  if (!spokenSkeleton || !targetSkeleton) return false;

  if (spokenSkeleton === targetSkeleton) return true;
  if (spokenSkeleton.startsWith(targetSkeleton) || targetSkeleton.startsWith(spokenSkeleton)) {
    return true;
  }

  // Accept very small near-miss pronunciations (e.g. "akba" vs "akbar").
  if (
    Math.abs(spokenSkeleton.length - targetSkeleton.length) <= 1 &&
    spokenSkeleton.slice(0, Math.min(spokenSkeleton.length, targetSkeleton.length)) ===
      targetSkeleton.slice(0, Math.min(spokenSkeleton.length, targetSkeleton.length))
  ) {
    return true;
  }

  return false;
}

function orderedTailMatchCount(spokenWords: string[], targetWords: string[]): number {
  if (spokenWords.length === 0 || targetWords.length === 0) return 0;

  const maxComparable = Math.min(spokenWords.length, targetWords.length);
  let matched = 0;

  for (let offset = 1; offset <= maxComparable; offset += 1) {
    const spoken = spokenWords[spokenWords.length - offset];
    const target = targetWords[targetWords.length - offset];
    if (!spoken || !target) break;
    if (!wordsLooselyMatch(spoken, target)) break;
    matched += 1;
  }

  return matched;
}

export default function Home() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const currentZikr = useTasbihStore((s) => s.currentZikr);
  const counter = useTasbihStore((s) => s.counter);
  const isStarted = useTasbihStore((s) => s.isStarted);
  const mode = useTasbihStore((s) => s.mode);
  const vibrationEnabled = useTasbihStore((s) => s.preferences.vibration);
  const wakeLockEnabled = useTasbihStore((s) => s.preferences.wakeLockEnabled);
  const confettiEnabled = useTasbihStore((s) => s.preferences.confetti);
  const tapSound = useTasbihStore((s) => s.preferences.tapSound);
  const customTarget = useTasbihStore((s) => s.customTarget);
  const increment = useTasbihStore((s) => s.increment);
  const reset = useTasbihStore((s) => s.reset);
  const undoLast = useTasbihStore((s) => s.undoLast);
  const setCustomTarget = useTasbihStore((s) => s.setCustomTarget);
  const toggleMode = useTasbihStore((s) => s.toggleMode);
  const selectZikrAsList = useTasbihStore((s) => s.selectZikrAsList);
  const customLists = useTasbihStore((s) => s.customLists);
  const speechRecognitionLanguage = useTasbihStore(
    (s) => s.preferences.speechRecognitionLanguage
  );
  const speechTolerance = useTasbihStore((s) => s.preferences.speechTolerance);

  const t = useT();

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoIntervalMs, setAutoIntervalMs] = useState(1000);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioAccessState, setAudioAccessState] = useState<AudioAccessState>("idle");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [audioMatchProgress, setAudioMatchProgress] = useState(0);
  const [audioLastMatchedText, setAudioLastMatchedText] = useState("");
  const [audioMatchFlash, setAudioMatchFlash] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  );
  const [isWindowFocused, setIsWindowFocused] = useState(
    typeof document === "undefined" || typeof document.hasFocus !== "function"
      ? true
      : document.hasFocus()
  );
  const prevIsCompleted = useRef(false);

  const target = currentZikr?.defaultTarget ?? 0;

  const activeListId = useTasbihStore((s) => s.activeListId);
  const activeList = useTasbihStore((s) => s.activeList);
  const activeIndex = useTasbihStore((s) => s.activeIndex);
  const nextZikrInList = useTasbihStore((s) => s.nextZikrInList);
  const selectList = useTasbihStore((s) => s.selectList);

  const isListMode = activeListId !== DEFAULT_LIST_ID && activeList.length > 0;
  const isAutoMode = mode === "auto";
  const isAudioMode = mode === "audio";
  const isDownMode = mode === "down";

  const effectiveTarget = isListMode ? target : (customTarget ?? target);
  const isCompleted = isDownMode
    ? counter <= 0
    : counter >= effectiveTarget && effectiveTarget > 0;
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

  const scheduleAlignCurrentListChip = useEffectEvent((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => alignCurrentListChip(behavior));
  });

  const triggerHaptic = (pattern: number | number[], options?: { playSound?: boolean }) => {
    if (!vibrationEnabled && tapSound === "off") return;
    if (typeof window === "undefined") return;

    // Hardware vibration where supported (typically Android/Chrome).
    if (vibrationEnabled && typeof window.navigator?.vibrate === "function") {
      window.navigator.vibrate(pattern);
    }

    if (options?.playSound === false || tapSound === "off") return;

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

  const handleAutoIncrement = useEffectEvent(() => {
    increment();
    setPulseTrigger((t) => t + 1);
  });

  const handleAudioIncrement = useEffectEvent(() => {
    increment();
    triggerHaptic(12, { playSound: false });
    setPulseTrigger((t) => t + 1);
  });

  const handleQuitList = () => {
    selectList(DEFAULT_LIST_ID);
    reset();
  };

  const triggerCompletionFeedback = useEffectEvent(() => {
    triggerHaptic([35, 40, 35]);
    if (confettiEnabled) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#E4B15A", "#FFFFFF"],
      });
    }
  });

  useEffect(() => {
    if (isCompleted && !prevIsCompleted.current) {
      triggerCompletionFeedback();
    }

    prevIsCompleted.current = isCompleted;
  }, [isCompleted]);

  const [searchQuery, setSearchQuery] = useState("");

  const groupedZikrs = useMemo(() => {
    const map = new Map<string, typeof zikrs>();
    zikrs.forEach((d) => {
      const list = map.get(d.category) ?? [];
      list.push(d);
      map.set(d.category, list);
    });
    return map;
  }, []);

  const formatZikrCount = (count: number) => `${count} ${count === 1 ? "zikr" : "zikrs"}`;

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

  const filteredGroupEntries = !isSearching
    ? Array.from(groupedZikrs.entries())
    : Array.from(groupedZikrs.entries()).reduce<[string, typeof zikrs][]>(
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

  const filteredCustomLists = !isSearching
    ? customLists
    : Object.entries(customLists).reduce<Record<string, string[]>>(
        (acc, [listId, ids]) => {
          const matchListId = matchesSearch(listId);
          const items = ids
            .map((id) => zikrs.find((d) => d.id === id))
            .filter(Boolean) as typeof zikrs;
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

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [customListsExpanded, setCustomListsExpanded] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionRestartTimerRef = useRef<number | null>(null);
  const speechCanIncrementRef = useRef(true);
  const speechLastIncrementAtRef = useRef(0);
  const speechRecentWordsRef = useRef<string[]>([]);
  const speechLastSegmentRef = useRef("");
  const speechShouldRunRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const supportsSpeechRecognition =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const normalizedSpeechTargets = useMemo(() => {
    const arabic = normalizePronouncedText(currentZikr?.arabic ?? "");
    const transliteration = normalizePronouncedText(currentZikr?.transliteration ?? "");
    const englishTranslation = normalizePronouncedText(currentZikr?.translation_en ?? "");
    const frenchTranslation = normalizePronouncedText(currentZikr?.translation_fr ?? "");

    const candidates = new Set<string>();
    if (arabic) candidates.add(arabic);
    if (transliteration) candidates.add(transliteration);
    if (englishTranslation) candidates.add(englishTranslation);
    if (frenchTranslation) candidates.add(frenchTranslation);

    const base = transliteration || englishTranslation || frenchTranslation;
    if (base) {
      candidates.add(base.replace(/allah/g, "llah"));
      candidates.add(base.replace(/llah/g, "allah"));
      candidates.add(base.replace(/\bwa\b/g, "oua"));
      candidates.add(base.replace(/\boua\b/g, "wa"));
      candidates.add(base.replace(/\bal\b/g, "el"));
      candidates.add(base.replace(/\bel\b/g, "al"));
    }

    return Array.from(candidates)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }, [
    currentZikr?.arabic,
    currentZikr?.transliteration,
    currentZikr?.translation_en,
    currentZikr?.translation_fr,
  ]);

  const targetDisplayText = currentZikr?.arabic || currentZikr?.transliteration || "";
  const showSpeechDebug = process.env.NODE_ENV !== "production";
  const normalizedAudioTranscript = normalizePronouncedText(audioTranscript);

  const speechToleranceConfig = useMemo(() => {
    if (speechTolerance === "strict") {
      return {
        requiredWordRatio: 0.8,
        cooldownMs: 1200,
        rearmProgress: 0.18,
        allowContainedPartial: true,
        containedMinLengthRatio: 0.72,
      };
    }

    if (speechTolerance === "tolerant") {
      return {
        requiredWordRatio: 0.5,
        cooldownMs: 600,
        rearmProgress: 0.35,
        allowContainedPartial: true,
        containedMinLengthRatio: 0.5,
      };
    }

    return {
      requiredWordRatio: 0.65,
      cooldownMs: 800,
      rearmProgress: 0.28,
      allowContainedPartial: true,
      containedMinLengthRatio: 0.62,
    };
  }, [speechTolerance]);

  useEffect(() => () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
  }, []);

  const stopSpeechRecognition = useEffectEvent(() => {
    if (recognitionRestartTimerRef.current !== null) {
      window.clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }

    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    }

    speechCanIncrementRef.current = true;
    speechRecentWordsRef.current = [];
    speechLastSegmentRef.current = "";
    setAudioTranscript("");
    setAudioMatchProgress(0);
    setAudioLastMatchedText("");
  });

  const processSpeechTranscript = useEffectEvent((rawTranscript: string) => {
    const normalizedSegment = normalizePronouncedText(rawTranscript);

    if (!normalizedSegment || normalizedSpeechTargets.length === 0) {
      speechRecentWordsRef.current = [];
      speechLastSegmentRef.current = "";
      speechCanIncrementRef.current = true;
      setAudioTranscript("");
      setAudioMatchProgress(0);
      return;
    }

    if (speechLastSegmentRef.current === normalizedSegment) {
      return;
    }

    speechLastSegmentRef.current = normalizedSegment;
    const mergedWords = [
      ...speechRecentWordsRef.current,
      ...normalizedSegment.split(" ").filter(Boolean),
    ].slice(-12);
    speechRecentWordsRef.current = mergedWords;

    const normalizedSpoken = mergedWords.join(" ");
    setAudioTranscript(normalizedSpoken);

    const spokenWords = normalizedSpoken.split(" ").filter(Boolean);
    let bestPrefixCount = 0;
    let bestTargetLength = 1;
    let fullMatch = false;

    for (const targetText of normalizedSpeechTargets) {
      const targetWords = targetText.split(" ").filter(Boolean);
      if (targetWords.length === 0) continue;

      const prefixCount = orderedTailMatchCount(spokenWords, targetWords);
      if (prefixCount > bestPrefixCount) {
        bestPrefixCount = prefixCount;
        bestTargetLength = targetWords.length;
      }

      const requiredMatchedWords = Math.max(
        targetWords.length === 1 ? 1 : 2,
        Math.ceil(targetWords.length * speechToleranceConfig.requiredWordRatio)
      );

      const spokenWordCount = spokenWords.length;
      const hasContainedPartial =
        speechToleranceConfig.allowContainedPartial &&
        targetText.includes(normalizedSpoken) &&
        spokenWordCount >= Math.max(1, requiredMatchedWords - 1) &&
        normalizedSpoken.length >=
          Math.floor(targetText.length * speechToleranceConfig.containedMinLengthRatio);

      const hasFullOrderedMatch = prefixCount >= targetWords.length;

      if (targetWords.length > 1) {
        if (hasFullOrderedMatch) {
          fullMatch = true;
        }
        continue;
      }

      if (prefixCount >= requiredMatchedWords || hasFullOrderedMatch || hasContainedPartial) {
        fullMatch = true;
      }
    }

    const progress = Math.min(1, bestPrefixCount / bestTargetLength);
    setAudioMatchProgress(progress);

    const now = Date.now();
    if (
      fullMatch &&
      speechCanIncrementRef.current &&
      now - speechLastIncrementAtRef.current >= speechToleranceConfig.cooldownMs
    ) {
      speechCanIncrementRef.current = false;
      speechLastIncrementAtRef.current = now;
      setAudioLastMatchedText(normalizedSpoken);
      setAudioMatchFlash(true);
      handleAudioIncrement();

      // Clear instantly after increment so stale words cannot trigger ghost matches.
      speechRecentWordsRef.current = [];
      speechLastSegmentRef.current = "";
      setAudioTranscript("");
      setAudioMatchProgress(0);
      setAudioLastMatchedText("");

      window.setTimeout(() => {
        setAudioMatchFlash(false);
        speechCanIncrementRef.current = true;
      }, 250);
      return;
    }

    if (!fullMatch && progress < speechToleranceConfig.rearmProgress) {
      speechCanIncrementRef.current = true;
    }
  });

  const startSpeechRecognition = useEffectEvent(function bootSpeechRecognition() {
    if (!supportsSpeechRecognition) {
      setAudioAccessState("unsupported");
      return;
    }

    if (recognitionRef.current) return;

    const recognitionWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionClass =
      recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setAudioAccessState("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = speechRecognitionLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = "";
      for (let index = event.results.length - 1; index >= event.resultIndex; index -= 1) {
        const result = event.results[index];
        if (!result || result.length === 0) continue;
        transcript = result[0].transcript.trim();
        if (transcript) break;
      }
      processSpeechTranscript(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setAudioAccessState("denied");
      } else {
        setAudioAccessState("error");
      }
      setAudioEnabled(false);
      stopSpeechRecognition();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!speechShouldRunRef.current) return;
      recognitionRestartTimerRef.current = window.setTimeout(() => {
        recognitionRestartTimerRef.current = null;
        bootSpeechRecognition();
      }, 200);
    };

    recognitionRef.current = recognition;
    setAudioAccessState("granted");

    try {
      recognition.start();
    } catch {
      setAudioAccessState("error");
      setAudioEnabled(false);
      stopSpeechRecognition();
    }
  });

  const releaseWakeLock = useEffectEvent(async () => {
    const sentinel = wakeLockRef.current;
    if (!sentinel) return;

    wakeLockRef.current = null;
    try {
      await sentinel.release();
    } catch {
      // Ignore release failures from transient browser state.
    }
  });

  const requestWakeLock = useEffectEvent(async () => {
    if (typeof navigator === "undefined") return;

    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (type: "screen") => Promise<WakeLockSentinelLike>;
      };
    };

    if (!nav.wakeLock || wakeLockRef.current) return;

    try {
      const sentinel = await nav.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      sentinel.addEventListener?.("release", () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Request can fail when tab is hidden or browser rejects wake lock.
    }
  });

  const listPosition = `${activeIndex + 1} / ${activeList.length}`;
  const isListComplete =
    isListMode && isCompleted && activeIndex === activeList.length - 1;
  const executionModeLabel = isAutoMode
    ? t("counter.modeAuto")
    : isAudioMode
      ? t("counter.modeAudio")
    : isDownMode
      ? t("counter.modeDecrement")
      : t("counter.modeIncrement");
  const initialCounter = isDownMode ? effectiveTarget : 0;
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
    const handler = (event: MouseEvent) => {
      if (!dropdownOpen) return;
      if (!dropdownRef.current) return;
      if (event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };

    const keyHandler = (event: KeyboardEvent) => {
      if (!dropdownOpen) return;
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setSearchQuery("");
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

  useEffect(() => {
    setAudioTranscript("");
    setAudioMatchProgress(0);
    setAudioLastMatchedText("");
    speechCanIncrementRef.current = true;
    speechRecentWordsRef.current = [];
    speechLastSegmentRef.current = "";
  }, [currentZikr?.id]);

  useEffect(() => {
    const updateVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };
    const onFocus = () => setIsWindowFocused(true);
    const onBlur = () => setIsWindowFocused(false);

    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const autoRunning = isAutoMode && autoEnabled && !isCompleted;
  const audioRunning = isAudioMode && audioEnabled && !isCompleted;
  const canAutoRun = autoRunning && isDocumentVisible && isWindowFocused;
  const canAudioRun = audioRunning && isDocumentVisible && isWindowFocused;
  const shouldHoldWakeLock =
    wakeLockEnabled &&
    !isCompleted &&
    isDocumentVisible &&
    isWindowFocused &&
    (isStarted || autoRunning || audioRunning);

  useEffect(() => {
    if (!canAutoRun) return;
    const timer = window.setInterval(() => {
      handleAutoIncrement();
    }, autoIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [canAutoRun, autoIntervalMs]);

  useEffect(() => {
    if (shouldHoldWakeLock) {
      void requestWakeLock();
      return;
    }

    void releaseWakeLock();
  }, [shouldHoldWakeLock]);

  useEffect(
    () => () => {
      void releaseWakeLock();
    },
    []
  );

  useEffect(
    () => () => {
      stopSpeechRecognition();
    },
    []
  );

  const autoStatusLabel = !autoEnabled
    ? t("counter.autoStatusOff")
    : !isDocumentVisible
      ? t("counter.autoStatusPausedHidden")
      : !isWindowFocused
        ? t("counter.autoStatusPausedFocus")
        : isCompleted
          ? t("counter.autoStatusDone")
          : t("counter.autoStatusRunning");

  const speechShouldRun = isAudioMode && audioEnabled && canAudioRun;

  useEffect(() => {
    speechShouldRunRef.current = speechShouldRun;
  }, [speechShouldRun]);

  useEffect(() => {
    if (!isAudioMode || !audioEnabled) {
      stopSpeechRecognition();
      return;
    }

    if (!supportsSpeechRecognition) {
      stopSpeechRecognition();
      return;
    }

    if (!canAudioRun) {
      stopSpeechRecognition();
      return;
    }

    startSpeechRecognition();
  }, [
    isAudioMode,
    audioEnabled,
    canAudioRun,
    supportsSpeechRecognition,
    speechRecognitionLanguage,
  ]);

  const audioStatusLabel = !supportsSpeechRecognition
    ? t("counter.audioStatusUnsupported")
    : audioAccessState === "denied"
      ? t("counter.audioStatusDenied")
      : audioAccessState === "error"
        ? t("counter.audioStatusError")
        : !audioEnabled
          ? t("counter.audioStatusOff")
          : !isDocumentVisible
            ? t("counter.audioStatusPausedHidden")
            : !isWindowFocused
              ? t("counter.audioStatusPausedFocus")
              : isCompleted
                ? t("counter.audioStatusDone")
                : t("counter.audioStatusListening");

  const audioHelpText = !supportsSpeechRecognition
    ? t("counter.audioUnsupportedHelp")
    : audioAccessState === "denied"
      ? t("counter.audioDeniedHelp")
      : audioAccessState === "error"
        ? t("counter.audioErrorHelp")
        : t("counter.audioHint");

  const renderPronunciationText = (text: string, className: string) => {
    return <span className={`text-[var(--primary)] ${className}`}>{text}</span>;
  };

  const renderAutoControls = () => (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
            {t("counter.autoTitle")}
          </div>
          <div className="text-xs text-[var(--secondary)]">{autoStatusLabel}</div>
        </div>

        <button
          type="button"
          onClick={() => setAutoEnabled((v) => !v)}
          disabled={isCompleted}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            autoRunning
              ? "bg-[var(--primary)] text-black"
              : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
          } ${isCompleted ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {autoRunning ? t("counter.autoStop") : t("counter.autoStart")}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-[var(--secondary)]" htmlFor="auto-speed">
          {t("counter.autoSpeed")}
        </label>
        <select
          id="auto-speed"
          value={autoIntervalMs}
          onChange={(e) => setAutoIntervalMs(Number(e.target.value) || 1000)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
        >
          <option value={500}>0.5s</option>
          <option value={1000}>1s</option>
          <option value={2000}>2s</option>
        </select>
      </div>
    </section>
  );

  const renderAudioControls = () => (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
            {t("counter.audioTitle")}
          </div>
          <div className="text-xs text-[var(--secondary)]">{audioStatusLabel}</div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (audioEnabled) {
              setAudioEnabled(false);
              return;
            }

            setAudioAccessState((current) => (current === "unsupported" ? current : "idle"));
            setAudioEnabled(true);
          }}
          disabled={!supportsSpeechRecognition}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            audioRunning
              ? "bg-[var(--primary)] text-black"
              : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
          } ${!supportsSpeechRecognition ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {audioRunning ? t("counter.audioStop") : t("counter.audioStart")}
        </button>
      </div>

      <div className="mt-2 text-sm text-[var(--secondary)]">{audioHelpText}</div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--secondary)]">
          <span>{t("counter.audioMatchProgress")}</span>
          <span>{Math.round(audioMatchProgress * 100)}%</span>
        </div>
        <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-[var(--background)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-75"
            style={{ width: `${Math.round(audioMatchProgress * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-[var(--secondary)]">
        <div>
          {t("counter.audioExpected")}:{" "}
          <span
            key={audioMatchFlash ? "flash" : "idle"}
            className={`text-[var(--foreground)] font-semibold${
              audioMatchFlash ? " audio-match-glow" : ""
            }`}
          >
            {targetDisplayText || "-"}
          </span>
        </div>
        <div>
          {t("counter.audioHeard")}: <span className="text-[var(--foreground)]">{audioTranscript || "-"}</span>
        </div>
        <div>
          {t("counter.audioLastMatched")}: <span className="text-[var(--foreground)]">{audioLastMatchedText || "-"}</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-[var(--secondary)]">{t("counter.audioSpeechModeHint")}</div>

      {showSpeechDebug && (
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--secondary)]">
          <div>debug: heard(norm) = {normalizedAudioTranscript || "-"}</div>
          <div>debug: targets = {normalizedSpeechTargets.join(" | ") || "-"}</div>
          <div>debug: tolerance = {speechTolerance}</div>
        </div>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {audioLastMatchedText
          ? t("counter.audioMatchedAnnouncement", { zikr: targetDisplayText })
          : ""}
      </div>
    </section>
  );

  if (!mounted) return null;

  const renderCompteur = () => (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">🌙 Tasbih Digital</h1>
        {!focusMode && (
          <p className="text-sm text-[var(--secondary)]">{ t("counter.subtitle") }</p>
        )}
        <div className="flex gap-2 items-center justify-center flex-wrap">
          <button
            type="button"
            onClick={toggleMode}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition hover:border-[var(--primary)]"
            aria-label={t("counter.ariaChangeMode")}
          >
            Mode: {executionModeLabel}
          </button>
          <button
            type="button"
            onClick={() => setFocusMode((v) => !v)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              focusMode
                ? "border-[var(--primary)] bg-[var(--primary)] text-black"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--primary)] hover:border-[var(--primary)]"
            }`}
            aria-label={focusMode ? t("counter.focusExitAriaLabel") : t("counter.focusEnterAriaLabel")}
          >
            {focusMode ? "✕ Focus" : "⊙ Focus"}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4" style={{ display: focusMode ? "none" : "flex" }}>
        <div className="flex flex-col gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (dropdownOpen) setSearchQuery("");
              setDropdownOpen((open) => !open);
            }}
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
                      {t("counter.selectionBadge")}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--secondary)]">
                    {formatZikrCount(activeList.length)}
                  </div>
                </>
              ) : (
                <span className="truncate text-sm font-semibold text-[var(--foreground)]">{t("counter.allZikr")}</span>
              )}
            </div>
            <span className="ml-3 text-lg text-[var(--secondary)]">{dropdownOpen ? "⌃" : "⌄"}</span>
          </button>

          {dropdownOpen && (
            <div
              id="zikr-selection-dropdown"
              role="region"
              aria-label={t("counter.dropdownLabel")}
              className="mt-2 max-h-[60vh] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={(e) => setSearchQuery(e.target.value.trim())}
                  placeholder={t("counter.searchPlaceholder")}
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
                  <span>{t("counter.library")}</span>
                </span>
                <span className="text-sm">{libraryExpanded ? "⌄" : "›"}</span>
              </button>

              {libraryExpanded && (
                <>
              {filteredGroupEntries.length === 0 &&
                Object.keys(filteredCustomLists).length === 0 && (
                  <div className="px-4 py-3 text-sm text-[var(--secondary)]">
                    {t("counter.noResults")}
                  </div>
                )}

              {filteredGroupEntries.map(([category, items]) => {
                const expanded = isSearching ? true : expandedGroups[category] ?? false;
                return (
                  <div key={category} className="border-b border-[var(--border)] last:border-b-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={t("counter.ariaSelect", { name: category })}
                      className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/[0.03]"
                      onClick={() => {
                        selectList(category);
                        setDropdownOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        selectList(category);
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
                          aria-label={expanded ? t("counter.ariaCollapse") : t("counter.ariaExpand")}
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
                              selectZikrAsList(d.id);
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
                  <span>{t("counter.customLists")}</span>
                </span>
                <span className="text-sm">{customListsExpanded ? "⌄" : "›"}</span>
              </button>

              {customListsExpanded && (
                <>
              {Object.keys(filteredCustomLists).length === 0 ? (
                <div className="px-4 py-2 text-sm text-[var(--secondary)]">{t("counter.noListsCreated")}</div>
              ) : (
                Object.entries(filteredCustomLists).map(([listId, ids]) => {
                  const expanded = isSearching ? true : expandedGroups[listId] ?? false;
                  const items = ids
                    .map((id) => zikrs.find((d) => d.id === id))
                    .filter(Boolean) as typeof zikrs;
                  return (
                    <div key={listId} className="border-b border-[var(--border)] last:border-b-0">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={t("counter.ariaSelect", { name: listId })}
                        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/[0.03]"
                        onClick={() => {
                          selectList(listId);
                          setDropdownOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          selectList(listId);
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
                            aria-label={expanded ? t("counter.ariaCollapse") : t("counter.ariaExpand")}
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
                                selectZikrAsList(d.id);
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

      </div>

      <motion.div layout className="flex flex-col items-center gap-4">
        {currentZikr && (
          <div className="text-center">
            <div className="text-[2rem] font-bold">
              {renderPronunciationText(currentZikr.arabic, "")}
            </div>
            <div className="mt-2 text-sm text-[var(--secondary)]">{currentZikr.transliteration}</div>
          </div>
        )}

        <CircleProgress
          value={counter}
          target={effectiveTarget}
          mode={mode}
          isCompleted={isCompleted}
          pulseTrigger={pulseTrigger}
        />
        <div className="text-center">
          <div className="text-sm font-semibold text-[var(--secondary)]">{t("counter.target")}</div>
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
        {isAutoMode ? (
          renderAutoControls()
        ) : isAudioMode ? (
          renderAudioControls()
        ) : (
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
            {t("counter.tap")}
          </motion.button>
        )}

        <AnimatePresence>
          {isListMode && isCompleted && !isListComplete && (
            <motion.button
              onClick={nextZikrInList}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
            >
              {t("counter.nextZikr")}
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          {!focusMode && !isAutoMode && (
            <button
              onClick={undoLast}
              aria-label={t("counter.ariaUndo")}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
            >
              {t("counter.undo")}
            </button>
          )}
          <button
            onClick={handleResetRequest}
            className={`${!focusMode && !isAutoMode ? "flex-1" : "w-full"} rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95`}
          >
            {t("counter.reset")}
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderListMode = () => {
    const currentZikrInList = currentZikr;

    const renderChip = (zikrId: string, index: number) => {
      const zikr = zikrs.find((d) => d.id === zikrId);
      if (!zikr) return null;

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
          key={zikrId}
          data-chip-index={index}
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {zikr.transliteration}
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
            aria-label={t("counter.ariaChangeMode")}
          >
            Mode: {executionModeLabel}
          </button>
        </div>

        <div ref={chipsContainerRef} className="max-h-[104px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2 pb-2 pt-2">
          {activeList.map((zikrId, index) => renderChip(zikrId, index))}
          </div>
        </div>

        <motion.div layout className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-[2rem] font-bold">
              {currentZikrInList
                ? renderPronunciationText(currentZikrInList.arabic, "")
                : null}
            </div>
            <div className="mt-2 text-sm text-[var(--secondary)]">
              {currentZikrInList?.transliteration}
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
          {isAutoMode ? (
            renderAutoControls()
          ) : isAudioMode ? (
            renderAudioControls()
          ) : (
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
              {t("counter.tap")}
            </motion.button>
          )}

          <AnimatePresence>
            {isCompleted && !isListComplete && (
              <motion.button
                onClick={nextZikrInList}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="w-full rounded-xl bg-[#22C55E] px-6 py-5 text-lg font-bold text-white transition hover:brightness-110 active:brightness-95"
              >
                {t("counter.nextZikr")}
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4">
            {!isAutoMode && (
              <button
                onClick={undoLast}
                aria-label={t("counter.ariaUndo")}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95"
              >
                {t("counter.undo")}
              </button>
            )}
            <button
              onClick={handleResetRequest}
              className={`${!isAutoMode ? "flex-1" : "w-full"} rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] active:brightness-95`}
            >
              {t("counter.reset")}
            </button>
          </div>

          <button
            onClick={handleQuitList}
            className="mt-4 mb-4 self-center rounded-lg px-4 py-1.5 text-center text-sm font-semibold text-[var(--secondary)] underline"
          >
            {t("counter.backToSimple")}
          </button>
        </motion.div>

        {isListComplete && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {t("counter.listComplete")}
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
        title={t("counter.resetModal.title")}
        onClose={() => setShowResetConfirm(false)}
        closeOnOverlayClick={false}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              {t("counter.resetModal.cancel")}
            </button>
            <button
              onClick={handleResetConfirm}
              className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white"
            >
              {t("counter.resetModal.confirm")}
            </button>
          </div>
        }
      >
        <div className="text-sm text-[var(--secondary)]">
          {t("counter.resetModal.body")}
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}
