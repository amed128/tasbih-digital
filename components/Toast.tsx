"use client";

import { useEffect, useRef, useState } from "react";

interface ToastProps {
  message: string;
  trigger: number; // increment to show; re-increments restart the timer
}

export function Toast({ message, trigger }: ToastProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    // Defer state update out of the effect body to satisfy lint rule.
    const showTimer = setTimeout(() => setShow(true), 0);
    timerRef.current = setTimeout(() => setShow(false), 2000);
    return () => {
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)] shadow-lg transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}
