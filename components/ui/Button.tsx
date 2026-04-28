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
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
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
