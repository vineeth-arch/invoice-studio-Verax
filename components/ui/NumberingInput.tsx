"use client";

import { AlertTriangle } from "lucide-react";
import { inputClass } from "./FormField";
import { cn } from "@/lib/utils/cn";

interface NumberingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isDuplicate?: boolean;
  isInvalid?: boolean;
}

export function NumberingInput({ isDuplicate, isInvalid, className, ...props }: NumberingInputProps) {
  return (
    <div className="space-y-1">
      <input
        type="text"
        className={cn(
          inputClass,
          isDuplicate && "border-amber-400 focus:ring-amber-400",
          isInvalid && "border-red-400 focus:ring-red-400",
          className
        )}
        {...props}
      />
      {isDuplicate && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          This number already exists. GST invoice numbers must be unique for the financial year.
        </div>
      )}
      {isInvalid && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          Max 16 characters. Only letters, numbers, / and - are allowed.
        </div>
      )}
    </div>
  );
}
