"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ACCENT_COLORS = [
  "var(--accent-yellow)",
  "var(--accent-purple)",
  "var(--accent-mint-bg)",
  "var(--accent-coral)",
];

let colorIndex = 0;

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  accentColor?: string;
}

export function FormSection({
  title,
  children,
  defaultOpen = true,
  className,
  accentColor,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // Cycle through accent colors if not explicitly provided
  const [color] = useState(() => {
    if (accentColor) return accentColor;
    const c = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
    colorIndex++;
    return c;
  });

  return (
    <div
      className={cn("overflow-hidden rounded-card", className)}
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-theme-surface-raised text-left"
        style={{ background: "var(--surface-raised)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-[3px] h-5 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span
            className="font-display font-bold text-[15px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {/* Always in DOM — CSS height toggle preserves RHF field registration */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[9999px]" : "max-h-0 overflow-hidden"
        )}
        aria-hidden={!isOpen}
      >
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}
