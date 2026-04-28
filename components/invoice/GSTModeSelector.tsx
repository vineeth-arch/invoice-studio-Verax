"use client";

import type { GSTMode } from "@/lib/types/common";
import { cn } from "@/lib/utils/cn";

const modes: { value: GSTMode; label: string; desc: string }[] = [
  { value: "CGST_SGST", label: "CGST + SGST", desc: "Intra-state" },
  { value: "IGST", label: "IGST", desc: "Inter-state" },
  { value: "NO_TAX", label: "No Tax", desc: "Exempt / NIL" },
  { value: "CUSTOM", label: "Custom", desc: "Manual" },
];

interface GSTModeSelectorProps {
  value: GSTMode;
  onChange: (mode: GSTMode) => void;
}

export function GSTModeSelector({ value, onChange }: GSTModeSelectorProps) {
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={cn(
            "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors text-center",
            value === m.value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          <div>{m.label}</div>
          <div className="text-[10px] text-slate-400 font-normal">{m.desc}</div>
        </button>
      ))}
    </div>
  );
}
