"use client";

import { motion, useAnimation } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

type CircleProgressProps = {
  value: number;
  target: number;
  mode: "up" | "down";
  isCompleted: boolean;
  pulseTrigger?: number;
  size?: number;
  strokeWidth?: number;
};

const GOLD = "#F5A623";
const GREEN = "#22C55E";
const BACKGROUND = "#1A1A1A";

export function CircleProgress({
  value,
  target,
  mode,
  isCompleted,
  pulseTrigger,
  size = 260,
  strokeWidth = 16,
}: CircleProgressProps) {
  const [mounted, setMounted] = useState(false);
  const pulseControls = useAnimation();
  const numberControls = useAnimation();
  const prevValueRef = useRef<number>(value);
  const prevIsCompletedRef = useRef<boolean>(isCompleted);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (prevValueRef.current !== value) {
      numberControls.start({
        scale: [1, 1.3, 1],
        color: ["#FFFFFF", "#F5A623", "#FFFFFF"],
        transition: { duration: 0.15 },
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

  const progress =
    target > 0
      ? Math.min(
          1,
          Math.max(
            0,
            mode === "up" ? value / target : (target - value) / target
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
          stroke="#2A2A2A"
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
            mode === "up"
              ? `${value} sur ${target}${isCompleted ? ", objectif atteint" : ""}`
              : `${value} restant${isCompleted ? ", objectif atteint" : ""}`
          }
          className="text-6xl font-bold leading-tight"
          style={{ color: isCompleted ? GREEN : "white" }}
        >
          {value}
        </motion.div>
        <div className="mt-1 text-sm font-semibold text-gray-300">
          {mode === "up" ? `/ ${target}` : "RESTANT"}
        </div>
        {isCompleted && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-200"
          >
            <span className="text-base">✓</span> Objectif atteint
          </div>
        )}
      </div>
    </motion.div>
  );
}
