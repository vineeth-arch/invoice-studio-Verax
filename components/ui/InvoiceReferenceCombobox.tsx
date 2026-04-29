"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils/cn";

export interface InvoiceReferenceOption {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  amount: number;
}

interface InvoiceReferenceComboboxProps {
  options: InvoiceReferenceOption[];
  value?: string;
  onChange: (value: string) => void;
  onSelect: (option: InvoiceReferenceOption) => void;
}

export function InvoiceReferenceCombobox({
  options,
  value = "",
  onChange,
  onSelect,
}: InvoiceReferenceComboboxProps) {
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 8);

    return options.filter((option) =>
      option.invoiceNumber.toLowerCase().includes(normalized) ||
      option.buyerName.toLowerCase().includes(normalized)
    ).slice(0, 8);
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onChange(nextValue);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn("block w-full rounded-md border border-slate-300 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500")}
          placeholder="Search invoice number or buyer..."
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">No saved invoices found.</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(option.invoiceNumber);
                  onChange(option.invoiceNumber);
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-900">{option.invoiceNumber}</div>
                <div className="text-xs text-slate-500">{option.buyerName}</div>
                <div className="text-xs text-slate-400">{formatCurrencyINR(option.amount)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
