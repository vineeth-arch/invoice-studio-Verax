"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseKnobArgs {
  min: number;
  max: number;
  defaultValue?: number;
  value?: number;
  step?: number;
  onChange?: (value: number) => void;
}

interface UseKnobResult {
  value: number;
  rotation: number;
  knobRef: React.RefCallback<HTMLElement>;
  setValue: (v: number) => void;
}

const MIN_ANGLE = -140;
const MAX_ANGLE = 140;

function valueToRotation(value: number, min: number, max: number): number {
  const ratio = (value - min) / (max - min);
  return MIN_ANGLE + ratio * (MAX_ANGLE - MIN_ANGLE);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function useKnob({
  min,
  max,
  defaultValue,
  value: controlledValue,
  step = 1,
  onChange,
}: UseKnobArgs): UseKnobResult {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? min
  );
  const value = isControlled ? controlledValue : internalValue;

  const elRef = useRef<HTMLElement | null>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);
  const velocity = useRef(0);
  const inertiaFrame = useRef<number | null>(null);

  const setValue = useCallback(
    (v: number) => {
      const clamped = clamp(Math.round(v / step) * step, min, max);
      if (!isControlled) setInternalValue(clamped);
      onChange?.(clamped);
    },
    [isControlled, min, max, step, onChange]
  );

  const getAngleFromPointer = useCallback(
    (el: HTMLElement, clientX: number, clientY: number): number => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    },
    []
  );

  const stopInertia = useCallback(() => {
    if (inertiaFrame.current !== null) {
      cancelAnimationFrame(inertiaFrame.current);
      inertiaFrame.current = null;
    }
  }, []);

  const knobRef: React.RefCallback<HTMLElement> = useCallback(
    (el) => {
      if (elRef.current) {
        elRef.current.removeEventListener("pointerdown", handlePointerDown);
        elRef.current.removeEventListener("keydown", handleKeyDown);
      }
      elRef.current = el;
      if (!el) return;
      el.addEventListener("pointerdown", handlePointerDown);
      el.addEventListener("keydown", handleKeyDown);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, setValue]
  );

  function handlePointerDown(e: Event) {
    const pe = e as PointerEvent;
    pe.preventDefault();
    stopInertia();
    dragging.current = true;
    lastAngle.current = getAngleFromPointer(
      elRef.current!,
      pe.clientX,
      pe.clientY
    );
    velocity.current = 0;
    (elRef.current as HTMLElement).setPointerCapture(pe.pointerId);
    elRef.current!.addEventListener("pointermove", handlePointerMove);
    elRef.current!.addEventListener("pointerup", handlePointerUp);
    elRef.current!.addEventListener("pointercancel", handlePointerUp);
  }

  function handlePointerMove(e: Event) {
    if (!dragging.current) return;
    const pe = e as PointerEvent;
    const angle = getAngleFromPointer(
      elRef.current!,
      pe.clientX,
      pe.clientY
    );
    let delta = angle - lastAngle.current;
    // Wrap delta to [-180, 180]
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    velocity.current = delta;
    lastAngle.current = angle;
    const range = max - min;
    const valueDelta = (delta / (MAX_ANGLE - MIN_ANGLE)) * range;
    setValue(value + valueDelta);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handlePointerUp(_: Event) {
    dragging.current = false;
    const el = elRef.current!;
    el.removeEventListener("pointermove", handlePointerMove);
    el.removeEventListener("pointerup", handlePointerUp);
    el.removeEventListener("pointercancel", handlePointerUp);
    // Inertia decay — normalised to 60fps so decay rate is frame-rate independent
    let vel = velocity.current;
    let currentVal = value;
    let lastTime = performance.now();
    function decay(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      // Decay by 0.92 per 16.67ms (one 60fps frame), scaled by actual elapsed time
      vel *= Math.pow(0.92, dt / 16.67);
      if (Math.abs(vel) < 0.1) return;
      const range = max - min;
      const vDelta = (vel / (MAX_ANGLE - MIN_ANGLE)) * range;
      currentVal = clamp(currentVal + vDelta, min, max);
      setValue(currentVal);
      inertiaFrame.current = requestAnimationFrame(decay);
    }
    inertiaFrame.current = requestAnimationFrame(decay);
  }

  function handleKeyDown(e: Event) {
    const ke = e as KeyboardEvent;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(ke.key)) return;
    ke.preventDefault();
    const dir = ke.key === "ArrowUp" || ke.key === "ArrowRight" ? 1 : -1;
    setValue(value + dir * step);
  }

  useEffect(() => () => stopInertia(), [stopInertia]);

  return {
    value,
    rotation: valueToRotation(value, min, max),
    knobRef,
    setValue,
  };
}
