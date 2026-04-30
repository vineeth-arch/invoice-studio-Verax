import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type CardVariant = "raised" | "raised-lg" | "inset" | "inset-sm" | "soft";

const variantClass: Record<CardVariant, string> = {
  "raised":    "nm-raised",
  "raised-lg": "nm-raised-lg",
  "inset":     "nm-pressed",
  "inset-sm":  "nm-pressed-sm",
  "soft":      "nm-soft",
};

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const NeuCard = forwardRef<HTMLDivElement, NeuCardProps>(
  ({ variant = "raised", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(variantClass[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NeuCard.displayName = "NeuCard";

/** Thin 2px neumorphic groove used as section separator — replaces <hr> */
export function NeuGroove({ className }: { className?: string }) {
  return (
    <div
      className={cn("nm-groove w-full", className)}
      role="separator"
      aria-hidden="true"
    />
  );
}
