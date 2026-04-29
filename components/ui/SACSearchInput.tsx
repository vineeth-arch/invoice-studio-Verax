"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { SACCode } from "@/lib/data/sac-codes";
import { searchSACCodes } from "@/lib/data/sac-codes";

interface SACSearchInputProps {
  value: string;
  onChange: (code: string) => void;
  onSelect: (sac: SACCode) => void;
}

const MAX_RESULTS = 8;

function gstBadgeText(rate: number) {
  return `GST ${rate}%`;
}

export function SACSearchInput({
  value,
  onChange,
  onSelect,
}: SACSearchInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const results = useMemo(
    () => searchSACCodes(query).slice(0, MAX_RESULTS),
    [query]
  );

  const showDropdown = isOpen && query.trim().length >= 2;

  const handleManualChange = (nextValue: string) => {
    setQuery(nextValue);
    onChange(nextValue);
    setIsOpen(nextValue.trim().length >= 2);
  };

  const handleSelect = (sac: SACCode) => {
    setQuery(sac.code);
    onChange(sac.code);
    onSelect(sac);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => handleManualChange(event.target.value)}
          onFocus={() => setIsOpen(query.trim().length >= 2)}
          className={cn(
            "block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          )}
          placeholder="Search SAC code or keyword"
        />
      </div>

      {showDropdown && (
        <div
          id={listId}
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80"
        >
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((sac) => (
                  <button
                    key={sac.code}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(sac)}
                    className="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono-di text-sm font-semibold text-slate-900">{sac.code}</div>
                        <div className="text-sm text-slate-700">{sac.description}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge>{sac.category}</Badge>
                      <Badge variant="success">{gstBadgeText(sac.defaultGstRate)}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">No matching SAC codes found.</div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsOpen(false)}
            className="w-full border-t border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            Not in list? Type code manually
          </button>
        </div>
      )}
    </div>
  );
}
