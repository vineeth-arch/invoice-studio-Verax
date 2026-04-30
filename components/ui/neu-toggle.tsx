"use client";

import { useCallback, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./neu-toggle.module.css";

interface NeuToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

export function NeuToggle({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  id: externalId,
  className,
}: NeuToggleProps) {
  const autoId = useId();
  const id = externalId ?? autoId;

  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const checked = isControlled ? controlledChecked : internalChecked;

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }, [disabled, checked, isControlled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <div
      className={cn(styles.wrapper, className)}
      data-disabled={disabled ? "true" : undefined}
      onClick={toggle}
    >
      <div
        id={id}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={cn(styles.track, checked && styles["track--on"])}
      >
        <div className={cn(styles.thumb, checked && styles["thumb--on"])} />
      </div>
      {label && (
        <label
          htmlFor={id}
          className={cn(styles.label, disabled && "opacity-50")}
          onClick={(e) => e.preventDefault()}
        >
          {label}
        </label>
      )}
    </div>
  );
}
