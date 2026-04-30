"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type NeuVariant = "default" | "accent" | "ghost" | "danger";
type NeuSize    = "sm" | "md" | "lg";

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeuVariant;
  size?: NeuSize;
  loading?: boolean;
}

const sizeClass: Record<NeuSize, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-5 py-2.5 text-[13px]",
  lg: "px-7 py-3   text-[14px]",
};

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClass =
      variant === "accent" ? "btn-nm-primary" : "btn-nm";

    const colourOverride =
      variant === "ghost"
        ? { color: "var(--muted)" }
        : variant === "danger"
        ? { color: "var(--overdue)" }
        : undefined;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseClass,
          sizeClass[size],
          "inline-flex items-center justify-center gap-2 font-sans font-semibold leading-none",
          "transition-[box-shadow,transform] duration-[120ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)]",
          className
        )}
        style={colourOverride}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);
NeuButton.displayName = "NeuButton";

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="32"
        strokeDashoffset="10"
        strokeLinecap="round"
      />
    </svg>
  );
}
