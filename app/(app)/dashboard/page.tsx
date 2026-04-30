"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { formatCurrencyINR } from "@/lib/utils/formatting";
import { StatusBadge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { buildDashboardSnapshot, exportDashboardWorkbook, getAvailableMonths, getMonthLabel, toMonthKey } from "@/lib/utils/dashboardReconciliation";

function StatCard({
  label,
  value,
  sub,
  accentBg,
  accentText,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accentBg: string;
  accentText: string;
}) {
  return (
    <div
      className="rounded-bento flex min-h-[130px] flex-col justify-between p-6"
      style={{ background: accentBg, border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: accentText, opacity: 0.75 }}>
        {label}
      </p>
      <div>
        <div className="mt-3 font-mono text-2xl font-bold leading-none" style={{ color: accentText }}>
          {value}
        </div>
        {sub && (
          <p className="mt-1.5 text-xs font-medium" style={{ color: accentText, opacity: 0.7 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionPill({
  href,
  icon: Icon,
  label,
  bg,
  fg,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <Link href={href}>
      <div
        className="flex cursor-pointer items-center gap-3 rounded-[24px] px-5 py-3.5 text-sm font-medium transition-transform duration-150 hover:scale-[1.02]"
        style={{ background: bg, color: fg }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { configured, user } = useAuth();
  const { invoices, loading: invLoading } = useInvoices();
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const monthOptions = useMemo(() => getAvailableMonths(invoices), [invoices]);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(monthOptions[0] ?? toMonthKey(new Date().toISOString()) ?? "");
    }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const supabase = getSupabaseBrowserClient();
      void supabase?.auth.getSession().then(() => {
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);

  const finalInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "FINAL" || invoice.status === "PAID"),
    [invoices],
  );

  const snapshot = useMemo(
    () => buildDashboardSnapshot(invoices, selectedMonth || monthOptions[0] || toMonthKey(new Date().toISOString())),
    [invoices, monthOptions, selectedMonth],
  );

  const outstandingInvoices = finalInvoices.filter((i) => i.paymentStatus !== "Paid");
  const overdueInvoices = finalInvoices.filter((i) => i.paymentStatus === "Overdue");
  const poUnderApproval = purchaseOrders.filter((p) => p.poStatus === "Under Approval").length;
  const poApproved = purchaseOrders.filter((p) => p.poStatus === "Approved").length;
  const poProcessed = purchaseOrders.filter((p) => p.poStatus === "Processed").length;

  const recent = [
    ...invoices.map((i) => ({
      id: i.id,
      type: "invoice" as const,
      number: i.invoiceNumber,
      party: i.buyer.name,
      date: i.invoiceDate,
      amount: i.totals.grandTotal,
      status: i.status,
    })),
    ...purchaseOrders.map((p) => ({
      id: p.id,
      type: "po" as const,
      number: p.poNumber,
      party: p.vendor.name,
      date: p.poDate,
      amount: p.totals.grandTotal,
      status: p.status,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (invLoading || poLoading) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] p-5 md:p-7">
      {configured && !user && showSyncBanner && (
        <div
          className="mb-5 rounded-bento px-5 py-4"
          style={{ background: "var(--accent-yellow-muted)", border: "1px solid var(--accent-yellow)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--accent-yellow-text)" }}>
                Your data is saved locally only.
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--accent-yellow-text)", opacity: 0.8 }}>
                Sign in to sync across devices and enable cloud backup.
              </p>
              <Link
                href="/auth"
                className="mt-3 inline-flex rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
                style={{ background: "var(--accent-yellow)", color: "#111111" }}
              >
                Sign In
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowSyncBanner(false)}
              className="rounded-md p-1 transition-colors hover:bg-black/5"
              style={{ color: "var(--accent-yellow-text)" }}
              aria-label="Dismiss sign-in banner"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
            {profile ? profile.companyName : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Settlement view for {getMonthLabel(selectedMonth)}
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {monthOptions.length === 0 ? (
              <option value={selectedMonth}>{getMonthLabel(selectedMonth)}</option>
            ) : (
              monthOptions.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))
            )}
          </select>
          <Button variant="secondary" onClick={() => exportDashboardWorkbook(selectedMonth, snapshot)}>
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Billed This Month"
          value={formatCurrencyINR(snapshot.billedThisMonth)}
          sub={`${snapshot.invoiceRegisterRows.length} issued invoices`}
          accentBg="var(--accent-yellow)"
          accentText="#111111"
        />
        <StatCard
          label="Base Cleared This Month"
          value={formatCurrencyINR(snapshot.baseClearedThisMonth)}
          sub={`Avg ${snapshot.avgBaseClearanceDays} days to clear`}
          accentBg="var(--accent-mint-muted)"
          accentText="var(--accent-mint-text)"
        />
        <StatCard
          label="GST Cleared This Month"
          value={formatCurrencyINR(snapshot.gstClearedThisMonth)}
          sub={`${snapshot.awaitingGstCount} invoices still awaiting GST`}
          accentBg="var(--accent-purple)"
          accentText="#FFFFFF"
        />
        <StatCard
          label="Deferred GST Pending"
          value={formatCurrencyINR(snapshot.deferredGstPendingTotal)}
          sub={`${snapshot.basePaidGstPendingCount} base-paid invoices pending GST`}
          accentBg="var(--accent-coral)"
          accentText="#FFFFFF"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Clearance KPIs
              </h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Invoices Fully Cleared",
                value: String(snapshot.fullyClearedCountThisMonth),
                sub: formatCurrencyINR(snapshot.fullyClearedValueThisMonth),
              },
              {
                label: "Deferred Opening",
                value: formatCurrencyINR(snapshot.deferredOpeningPending),
                sub: "Pending at month start",
              },
              {
                label: "Deferred Closing",
                value: formatCurrencyINR(snapshot.deferredClosingPending),
                sub: "Pending at month end",
              },
              {
                label: "Avg Full Clearance",
                value: `${snapshot.avgFullClearanceDays} days`,
                sub: "Invoice to final settlement",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </div>
                <div className="mt-2 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {item.value}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Quick Actions
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ActionPill href="/invoice/new" icon={FileText} label="New Invoice" bg="var(--accent-yellow)" fg="#111111" />
            <ActionPill href="/purchase-order/new" icon={ShoppingCart} label="New PO" bg="var(--accent-purple)" fg="#FFFFFF" />
            <ActionPill href="/clients" icon={Users} label="New Client" bg="var(--accent-mint-muted)" fg="var(--accent-mint-text)" />
            <ActionPill href="/services" icon={BriefcaseBusiness} label="New Service" bg="var(--accent-coral-muted)" fg="var(--accent-coral-text)" />
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                GST Clearance Tracker
              </h2>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {snapshot.deferredRows.length} tracked invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Invoice", "Client", "Invoice Date", "Base Cleared", "GST Amount", "GST Cleared", "GST Pending", "Invoice Cleared", "Status"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.deferredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-400">
                      No deferred GST invoices yet.
                    </td>
                  </tr>
                ) : (
                  snapshot.deferredRows.slice(0, 10).map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-900">{row.invoiceNumber}</td>
                      <td className="px-3 py-3 text-slate-700">{row.client}</td>
                      <td className="px-3 py-3 text-slate-600">{row.invoiceDate}</td>
                      <td className="px-3 py-3 text-slate-900">{formatCurrencyINR(row.baseClearedAmount)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatCurrencyINR(row.gstAmount)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatCurrencyINR(row.gstClearedAmount)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatCurrencyINR(row.gstPending)}</td>
                      <td className="px-3 py-3 text-slate-600">{row.invoiceClearedDate || "Pending"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.paymentStatus === "Paid" ? "PAID" : "FINAL"} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Recent
              </h2>
            </div>
            <Link
              href="/documents"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--accent-yellow)" }}
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recent.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No documents yet.
              </p>
            ) : (
              recent.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-theme-surface-raised"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {doc.number}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {doc.party}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <span className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatCurrencyINR(doc.amount)}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
              Client GST Summary
            </h2>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Pending GST by client
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Client", "Billed", "Base Cleared", "GST Cleared", "Pending Base", "Pending GST"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.clientSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                      No reconciliation data for this month.
                    </td>
                  </tr>
                ) : (
                  snapshot.clientSummaryRows.slice(0, 8).map((row) => (
                    <tr key={row.client}>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.client}</td>
                      <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.billedAmount)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.baseClearedAmount)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.gstClearedAmount)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.pendingBaseAmount)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatCurrencyINR(row.pendingGstAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Operations Snapshot
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Outstanding Invoices", value: String(outstandingInvoices.length) },
              { label: "Overdue Invoices", value: String(overdueInvoices.length) },
              { label: "PO Under Approval", value: String(poUnderApproval) },
              { label: "PO Approved", value: String(poApproved) },
              { label: "PO Processed", value: String(poProcessed) },
              { label: "Invoices Awaiting GST", value: String(snapshot.awaitingGstCount) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <div className="font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
