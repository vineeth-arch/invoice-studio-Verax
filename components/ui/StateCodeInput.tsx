"use client";

import { useId } from "react";
import { CheckCircle2 } from "lucide-react";
import { FormField, inputClass } from "@/components/ui/FormField";
import { INDIAN_STATES, getCodeByState, getStateByCode } from "@/lib/data/states";

export interface StateCodeInputProps {
  stateValue: string;
  stateCodeValue: string;
  onStateChange: (value: string) => void;
  onStateCodeChange: (value: string) => void;
  stateError?: string;
  stateCodeError?: string;
  stateLabel?: string;
  stateCodeLabel?: string;
  required?: boolean;
}

export function StateCodeInput({
  stateValue,
  stateCodeValue,
  onStateChange,
  onStateCodeChange,
  stateError,
  stateCodeError,
  stateLabel = "State",
  stateCodeLabel = "State Code",
  required = false,
}: StateCodeInputProps) {
  const datalistId = useId();
  const matchedStateByCode = getStateByCode(stateCodeValue);
  const matchedCodeByState = getCodeByState(stateValue);
  const isSynced =
    Boolean(matchedStateByCode) &&
    matchedStateByCode?.toLowerCase() === stateValue.trim().toLowerCase();

  return (
    <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_80px] gap-3">
      <FormField label={stateLabel} required={required} error={stateError}>
        <div className="relative">
          <input
            type="text"
            list={datalistId}
            className={`${inputClass} pr-10`}
            placeholder="e.g. Maharashtra"
            value={stateValue}
            onChange={(event) => onStateChange(event.target.value)}
          />
          {isSynced && (
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-600"
              aria-label="State auto-filled"
              title="Matched from state code"
            >
              <CheckCircle2 className="h-4 w-4" />
            </span>
          )}
          <datalist id={datalistId}>
            {INDIAN_STATES.map((state) => (
              <option key={state.code} value={state.name} />
            ))}
          </datalist>
        </div>
      </FormField>

      <FormField label={stateCodeLabel} required={required} error={stateCodeError}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          className={inputClass}
          placeholder="e.g. 27"
          value={stateCodeValue}
          onChange={(event) => onStateCodeChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
        />
      </FormField>

      {!isSynced && matchedCodeByState && matchedCodeByState === stateCodeValue.trim() ? (
        <div className="col-span-2 -mt-1 text-xs text-emerald-600">
          State code matched from state name.
        </div>
      ) : null}
    </div>
  );
}
