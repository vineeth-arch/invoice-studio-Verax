"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./led-display.module.css";

function formatEnIN(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

interface LEDDisplayProps {
  value: number;
  digits?: number;
  prefix?: string;
  animate?: boolean;
  fontSize?: number | string;
  className?: string;
}

export function LEDDisplay({
  value,
  digits,
  prefix,
  animate = true,
  fontSize = 24,
  className,
}: LEDDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || value === prevValue.current) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    const from = prevValue.current;
    const to = value;
    prevValue.current = to;
    const duration = 550;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(t);
      setDisplayValue(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, animate]);

  const formatted = digits !== undefined
    ? String(Math.round(displayValue)).padStart(digits, "0")
    : formatEnIN(displayValue);

  return (
    <div
      className={cn(styles.enclosure, className)}
      role="status"
      aria-live="polite"
      aria-label={`${prefix ?? ""}${formatted}`}
    >
      {prefix && (
        <span className={styles.prefix} style={{ fontSize }}>
          {prefix}
        </span>
      )}
      <span className={styles.value} style={{ fontSize }}>
        {formatted}
      </span>
    </div>
  );
}
