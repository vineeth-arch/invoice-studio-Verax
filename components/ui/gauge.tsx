"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./gauge.module.css";

const CX = 100;
const CY = 100;
const R_BEZEL = 90;
const R_FACE  = 78;
const R_TICKS = 68;
const R_SCALE = 56;

/** Maps 0–100 value to -180°…0° (left semicircle = 0, right = 100) */
function valueToAngle(value: number): number {
  const clamped = Math.max(0, Math.min(100, value));
  return -180 + clamped * 1.8; // -180° at 0, 0° at 100
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

interface GaugeProps {
  value: number;
  label?: string;
  unit?: string;
  colour?: string;
  size?: number;
  animate?: boolean;
  className?: string;
}

function useSprungValue(target: number, animate: boolean): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) { setDisplay(target); return; }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = display;
    const range = target - start;
    let t = 0;
    const duration = 60; // frames

    function step() {
      t = Math.min(t + 1, duration);
      // Slightly overshooting spring: easeOutBack
      const progress = t / duration;
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
      setDisplay(start + range * eased);
      if (t < duration) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, animate]);

  return display;
}

function buildTicks() {
  const ticks: Array<{ angle: number; major: boolean; label?: string }> = [];
  // -180° to 0° in 10° steps
  for (let deg = -180; deg <= 0; deg += 10) {
    const isMajor = deg % 30 === 0;
    const pct = ((deg + 180) / 180) * 100;
    ticks.push({ angle: deg, major: isMajor, label: isMajor ? String(Math.round(pct)) : undefined });
  }
  return ticks;
}

const TICKS = buildTicks();

export function Gauge({
  value,
  label,
  unit,
  colour = "var(--amber)",
  size = 200,
  animate = true,
  className,
}: GaugeProps) {
  const sprung = useSprungValue(value, animate);
  const needleAngle = valueToAngle(sprung);

  const gradId = `bezelGrad-${Math.random().toString(36).slice(2, 7)}`;
  const faceGradId = `faceGrad-${Math.random().toString(36).slice(2, 7)}`;

  const needleTip = polarToXY(CX, CY, R_FACE - 10, needleAngle);

  return (
    <div className={cn(styles.outerWrap, className)}>
      <div
        className={styles.container}
        style={{ width: size, height: size / 2 + 20 }}
      >
        <svg
          className={styles.svg}
          viewBox={`5 10 190 105`}
          width={size}
          height={size / 2 + 20}
          aria-label={label ? `${label}: ${Math.round(value)}${unit ?? ""}` : `Gauge: ${Math.round(value)}`}
          role="img"
        >
          <defs>
            {/* Polished chrome bezel */}
            <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e8eef4" />
              <stop offset="40%" stopColor="#c8d4de" />
              <stop offset="80%" stopColor="#a8b8c8" />
              <stop offset="100%" stopColor="#8898a8" />
            </radialGradient>
            {/* Metal-glass face */}
            <radialGradient id={faceGradId} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#d8e2ec" />
              <stop offset="55%" stopColor="#b8c8d8" />
              <stop offset="100%" stopColor="#9aacbc" />
            </radialGradient>
          </defs>

          {/* Bezel ring — polished chrome */}
          <circle
            cx={CX} cy={CY}
            r={R_BEZEL}
            fill={`url(#${gradId})`}
            className={styles.bezel}
          />

          {/* Glass face */}
          <circle
            cx={CX} cy={CY}
            r={R_FACE}
            fill={`url(#${faceGradId})`}
            className={styles.face}
          />

          {/* Reflection highlight arc at top of bezel */}
          <path
            d={`M ${polarToXY(CX, CY, R_BEZEL - 4, -160).x} ${polarToXY(CX, CY, R_BEZEL - 4, -160).y}
               A ${R_BEZEL - 4} ${R_BEZEL - 4} 0 0 1 ${polarToXY(CX, CY, R_BEZEL - 4, -20).x} ${polarToXY(CX, CY, R_BEZEL - 4, -20).y}`}
            className={styles.reflection}
          />

          {/* Tick marks */}
          {TICKS.map(({ angle, major }) => {
            const outer = polarToXY(CX, CY, R_TICKS, angle);
            const inner = polarToXY(CX, CY, R_TICKS - (major ? 10 : 6), angle);
            return (
              <line
                key={angle}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                className={major ? styles.tickMajor : styles.tickMinor}
              />
            );
          })}

          {/* Scale labels at major ticks */}
          {TICKS.filter(t => t.major && t.label).map(({ angle, label: tickLabel }) => {
            const pos = polarToXY(CX, CY, R_SCALE, angle);
            return (
              <text
                key={angle}
                x={pos.x} y={pos.y}
                className={styles.scaleLabel}
              >
                {tickLabel}
              </text>
            );
          })}

          {/* Needle shaft */}
          <line
            x1={CX} y1={CY}
            x2={needleTip.x} y2={needleTip.y}
            stroke={colour}
            className={cn(styles.needle, styles.needleShaft)}
          />

          {/* Needle pivot circle */}
          <circle
            cx={CX} cy={CY}
            r={5}
            className={styles.needlePivot}
          />

          {/* Centre label */}
          {label && (
            <text x={CX} y={CY + 22} className={styles.gaugeLabel}>
              {label}{unit ? ` (${unit})` : ""}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
