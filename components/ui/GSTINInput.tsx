"use client";

import { useState, forwardRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { validateGSTIN } from "@/lib/utils/validation";
import { inputClass } from "./FormField";
import { cn } from "@/lib/utils/cn";

interface GSTINInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  optional?: boolean;
}

export const GSTINInput = forwardRef<HTMLInputElement, GSTINInputProps>(
  ({ value = "", onChange, optional, className, ...props }, ref) => {
    const [touched, setTouched] = useState(false);
    const upper = value.toUpperCase();
    const isValid = validateGSTIN(upper);
    const showValidation = touched && value.length > 0;

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={upper}
          maxLength={15}
          onChange={(e) => onChange?.(e.target.value.toUpperCase())}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 27AAAAA0000A1Z5"
          className={cn(inputClass, "pr-8 uppercase", className)}
          {...props}
        />
        {showValidation && (
          <span className="absolute right-2 top-2.5">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
          </span>
        )}
        {showValidation && !isValid && !optional && (
          <p className="text-xs text-amber-600 mt-0.5">
            GSTIN format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
          </p>
        )}
      </div>
    );
  }
);
GSTINInput.displayName = "GSTINInput";
