"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { SAC_CODES, searchSACCodes } from "@/lib/data/sac-codes";

const FILTERS = [
  "All",
  "Design",
  "Consulting",
  "IT Services",
  "Advertising",
  "Professional",
  "Other",
] as const;

const RECOMMENDED_CODES = new Set(["998391", "998392", "998311", "998314", "998361"]);

type FilterTab = typeof FILTERS[number];

function matchesCategoryFilter(category: string, filter: FilterTab) {
  switch (filter) {
    case "All":
      return true;
    case "Design":
      return category === "Specialty Design";
    case "Consulting":
      return category === "Consulting";
    case "IT Services":
      return category === "IT Services";
    case "Advertising":
      return category === "Advertising";
    case "Professional":
      return category === "Professional Services";
    case "Other":
      return !["Specialty Design", "Consulting", "IT Services", "Advertising", "Professional Services"].includes(category);
    default:
      return true;
  }
}

export default function SACCodesPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const results = useMemo(() => {
    const searched = query.trim().length >= 2 ? searchSACCodes(query) : SAC_CODES;
    return searched.filter((entry) => matchesCategoryFilter(entry.category, activeFilter));
  }, [activeFilter, query]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1600);
    } catch (error) {
      console.error("[SACCodesPage] failed to copy code", error);
    }
  };

  return (
    <AppShell>
      <div className="p-6 md:p-7">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="font-display text-[28px] font-extrabold leading-tight text-slate-900">
              SAC Code Reference
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Service Accounting Codes for GST invoicing
            </p>
          </div>

          <div className="mb-5">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, service type or keyword..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {results.map((entry) => {
              const isRecommended = RECOMMENDED_CODES.has(entry.code);
              const isCopied = copiedCode === entry.code;

              return (
                <article
                  key={entry.code}
                  className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  {isRecommended && (
                    <div className="absolute right-4 top-4">
                      <Badge variant="warning">★ Recommended</Badge>
                    </div>
                  )}

                  <div className="mb-3 flex items-start justify-between gap-4 pr-28">
                    <div className="font-mono-di text-2xl font-bold text-[#1f3b8f]">
                      [{entry.code}]
                    </div>
                    <Badge>{entry.category}</Badge>
                  </div>

                  <div className="line-clamp-3 text-sm leading-6 text-slate-700">
                    {entry.description}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">
                      GST Rate: {entry.defaultGstRate}%
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyCode(entry.code)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {isCopied ? "Copied!" : "Copy code"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
