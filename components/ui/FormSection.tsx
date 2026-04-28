"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function FormSection({ title, children, defaultOpen = true, className }: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-slate-200 rounded-lg bg-white overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      {/* Always in DOM — CSS visibility toggle to preserve RHF field registration */}
      <div
        className={cn("transition-all duration-200", isOpen ? "max-h-[9999px]" : "max-h-0 overflow-hidden")}
        aria-hidden={!isOpen}
      >
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}
