"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:     "bg-accent-yellow text-[#111111] hover:opacity-90 focus:ring-accent-yellow",
  secondary:   "bg-theme-surface-raised text-text-primary border border-theme-border hover:bg-theme-border focus:ring-theme-border-strong",
  ghost:       "bg-transparent text-text-secondary hover:bg-theme-surface-raised focus:ring-theme-border",
  destructive: "bg-accent-coral text-white hover:opacity-90 focus:ring-accent-coral",
  outline:     "border border-theme-border bg-theme-surface text-text-primary hover:bg-theme-surface-raised focus:ring-theme-border",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
