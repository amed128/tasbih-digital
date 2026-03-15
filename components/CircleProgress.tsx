"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

type CircleProgressProps = {
  value: number;
  target: number;
  mode: "up" | "down";
  isCompleted: boolean;
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
  size = 260,
  strokeWidth = 16,
}: CircleProgressProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
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
        <div
          className="text-6xl font-bold leading-tight"
          style={{ color: isCompleted ? GREEN : "white" }}
        >
          {value}
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-300">
          {mode === "up" ? `/ ${target}` : "RESTANT"}
        </div>
        {isCompleted && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-200">
            <span className="text-base">✓</span> Objectif atteint
          </div>
        )}
      </div>
    </div>
  );
}
