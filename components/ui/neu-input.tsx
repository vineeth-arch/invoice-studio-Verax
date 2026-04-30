"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

/* ── Label ───────────────────────────────────────────────────────── */

interface NeuLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const NeuLabel = forwardRef<HTMLLabelElement, NeuLabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("verax-label", className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" style={{ color: "var(--overdue)", marginLeft: 2 }}>
          *
        </span>
      )}
    </label>
  )
);
NeuLabel.displayName = "NeuLabel";

/* ── Input ───────────────────────────────────────────────────────── */

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ mono, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "verax-input",
        mono && "verax-input-mono",
        className
      )}
      {...props}
    />
  )
);
NeuInput.displayName = "NeuInput";

/* ── Textarea ────────────────────────────────────────────────────── */

export const NeuTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "verax-input font-serif resize-none",
      "leading-relaxed",
      className
    )}
    style={{ lineHeight: 1.8 }}
    {...props}
  />
));
NeuTextarea.displayName = "NeuTextarea";

/* ── Select ──────────────────────────────────────────────────────── */

export const NeuSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      className={cn(
        "verax-input w-full appearance-none cursor-pointer pr-8",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {/* Custom caret — no border, CSS-only */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
      style={{
        width: 0,
        height: 0,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderTop: "5px solid var(--muted)",
      }}
    />
  </div>
));
NeuSelect.displayName = "NeuSelect";

/* ── Field wrapper (label + input stacked) ───────────────────────── */

interface NeuFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function NeuField({ label, htmlFor, required, children, className }: NeuFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <NeuLabel htmlFor={htmlFor} required={required}>
          {label}
        </NeuLabel>
      )}
      {children}
    </div>
  );
}
