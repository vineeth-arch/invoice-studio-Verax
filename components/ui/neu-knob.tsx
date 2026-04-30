"use client";

import { cn } from "@/lib/utils/cn";
import { useKnob } from "@/lib/hooks/useKnob";
import styles from "./neu-knob.module.css";

interface NeuKnobProps {
  min: number;
  max: number;
  defaultValue?: number;
  value?: number;
  step?: number;
  unit?: string;
  label?: string;
  size?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function NeuKnob({
  min,
  max,
  defaultValue,
  value: controlledValue,
  step,
  unit,
  label,
  size = 80,
  onChange,
  className,
}: NeuKnobProps) {
  const { value, rotation, knobRef } = useKnob({
    min,
    max,
    defaultValue,
    value: controlledValue,
    step,
    onChange,
  });

  const indicatorHeight = size * 0.3;

  return (
    <div className={cn(styles.outer, className)}>
      {label && <span className={styles.label}>{label}</span>}

      <div
        ref={knobRef as React.RefCallback<HTMLDivElement>}
        className={styles.knob}
        style={{ width: size, height: size }}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label ?? "knob"}
        tabIndex={0}
      >
        {/* Concentric groove ring */}
        <div className={styles.groove} />

        {/* Indicator line rotated to current value */}
        <div
          className={styles.indicator}
          style={{
            height: indicatorHeight,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />

        {/* Centre pivot dot */}
        <div className={styles.pivot} />
      </div>

      {/* Value readout */}
      <span className={styles.valueDisplay}>
        {value}
        {unit && <span style={{ color: "var(--muted)", marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}
