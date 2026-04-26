"use client";

import { motion, useAnimation } from "framer-motion";
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { useT } from "@/hooks/useT";
import { useTasbihStore } from "@/store/tasbihStore";

type CircleProgressProps = {
  value: number;
  target: number;
  mode: "up" | "down" | "auto" | "audio";
  isCompleted: boolean;
  pulseTrigger?: number;
  size?: number;
  strokeWidth?: number;
};

const GOLD = "var(--primary)";
const GREEN = "var(--success)";
const BACKGROUND = "var(--card)";

export function CircleProgress({
  value,
  target,
  mode,
  isCompleted,
  pulseTrigger,
  size = 260,
  strokeWidth = 16,
}: CircleProgressProps) {
  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language);
  const fmt = (n: number) => language === "ar" ? n.toLocaleString("ar-SA") : language === "ur" ? n.toLocaleString("ur-PK") : language === "fa" ? n.toLocaleString("fa-IR") : String(n);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const pulseControls = useAnimation();
  const numberControls = useAnimation();
  const prevValueRef = useRef<number>(value);
  const prevIsCompletedRef = useRef<boolean>(isCompleted);

  useEffect(() => {
    if (!mounted) return;
    if (prevValueRef.current !== value) {
      numberControls.start({
        scale: [1, 1.3, 1],
        color: ["var(--foreground)", "var(--primary)", "var(--foreground)"],
        transition: { duration: 0.2 },
      });
      prevValueRef.current = value;
    }
  }, [value, numberControls, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (prevIsCompletedRef.current !== isCompleted) {
      prevIsCompletedRef.current = isCompleted;
    }
  }, [isCompleted, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (typeof pulseTrigger === "number") {
      pulseControls.start({
        scale: [1, 1.08, 1],
        transition: { duration: 0.2 },
      });
    }
  }, [pulseTrigger, pulseControls, mounted]);

  if (!mounted) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const countsDown = mode === "down";

  const progress =
    target > 0
      ? Math.min(
          1,
          Math.max(
            0,
            countsDown ? (target - value) / target : value / target
          )
        )
      : 0;
  const offset = circumference * (1 - progress);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      animate={pulseControls}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={BACKGROUND}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isCompleted ? GREEN : GOLD}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={numberControls}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={
            !countsDown
              ? t("circle.ariaUp", {
                  value,
                  target,
                  completed: isCompleted ? t("circle.ariaCompleted") : "",
                })
              : t("circle.ariaDown", {
                  value,
                  completed: isCompleted ? t("circle.ariaCompleted") : "",
                })
          }
          className="text-6xl font-bold leading-tight"
          style={{ color: isCompleted ? GREEN : "var(--foreground)" }}
        >
          {fmt(value)}
        </motion.div>
        <div className="mt-1 text-sm font-semibold text-[var(--secondary)]">
          {!countsDown ? `/ ${fmt(target)}` : t("circle.remaining")}
        </div>
        {isCompleted && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-[var(--foreground)]"
          >
            <span className="text-base">✓</span> {t("circle.objectiveReached")}
          </div>
        )}
      </div>
    </motion.div>
  );
}
