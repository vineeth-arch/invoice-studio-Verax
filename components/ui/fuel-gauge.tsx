"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./fuel-gauge.module.css";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function fillClass(pct: number): string {
  if (pct >= 90) return styles["fill--high"];
  if (pct >= 70) return styles["fill--mid"];
  return styles["fill--low"];
}

interface FuelGaugeProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function FuelGauge({
  value,
  onChange,
  readOnly = false,
  label,
  showValue = true,
  className,
}: FuelGaugeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const getPctFromPointer = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return clamp(pct, 0, 100);
  }, [value]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      e.preventDefault();
      dragging.current = true;
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onChange?.(getPctFromPointer(e.clientX));
    },
    [readOnly, onChange, getPctFromPointer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || readOnly) return;
      onChange?.(getPctFromPointer(e.clientX));
    },
    [readOnly, onChange, getPctFromPointer]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  const pct = clamp(value, 0, 100);

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.trackWrap}>
        <div
          ref={trackRef}
          className={styles.track}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className={cn(styles.fill, fillClass(pct))}
            style={{ width: `${pct}%` }}
          />
          {!readOnly && (
            <div
              className={cn(styles.handle, isDragging && styles["handle--dragging"])}
              style={{ left: `${pct}%` }}
              aria-hidden="true"
            />
          )}
        </div>
        {showValue && (
          <span className={styles.valueLabel}>{Math.round(pct)}%</span>
        )}
      </div>
    </div>
  );
}
