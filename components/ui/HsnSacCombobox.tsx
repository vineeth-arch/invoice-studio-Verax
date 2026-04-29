"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import sacCodes from "@/data/sac-codes.json";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { HsnSacCodeEntry } from "@/lib/types/hsn";

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 8;

const masterCodes = sacCodes as HsnSacCodeEntry[];

interface HsnSacComboboxProps {
  value?: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
  onSelectCode?: (entry: HsnSacCodeEntry) => void;
}

export function HsnSacCombobox({
  value = "",
  placeholder = "HSN/SAC code",
  className,
  onChange,
  onSelectCode,
}: HsnSacComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

    return masterCodes
      .filter((entry) =>
        entry.code.includes(normalizedQuery) ||
        entry.description.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, MAX_RESULTS);
  }, [normalizedQuery]);

  const handleManualChange = (nextValue: string) => {
    setQuery(nextValue);
    onChange(nextValue);
    setIsOpen(nextValue.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleSelect = (entry: HsnSacCodeEntry) => {
    setQuery(entry.code);
    onChange(entry.code);
    onSelectCode?.(entry);
    setIsOpen(false);
  };

  const showResults = isOpen && normalizedQuery.length >= MIN_QUERY_LENGTH;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          role="combobox"
          value={query}
          onChange={(event) => handleManualChange(event.target.value)}
          onFocus={() => setIsOpen(query.trim().length >= MIN_QUERY_LENGTH)}
          className={cn(
            "block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400",
            className
          )}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={listId}
        />
      </div>

      {showResults && (
        <div
          id={listId}
          className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80"
        >
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((entry) => (
                <button
                  key={`${entry.code}-${entry.description}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(entry)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-slate-900">{entry.code}</div>
                    <div className="truncate text-xs text-slate-500">{entry.description}</div>
                  </div>
                  <Badge className="shrink-0 bg-brand-50 text-brand-700">{entry.gstRate}% GST</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-slate-500">No matching codes found.</div>
          )}

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full rounded-xl border border-dashed border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Not in list? Type manually
          </button>
        </div>
      )}
    </div>
  );
}
