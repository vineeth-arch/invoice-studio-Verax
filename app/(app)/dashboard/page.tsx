"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  Landmark,
  ReceiptIndianRupee,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { formatCurrencyINR } from "@/lib/utils/formatting";
import { PaymentStatusBadge, POStatusBadge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  buildDashboardSnapshot,
  exportDashboardWorkbook,
  getAvailableMonths,
  getMonthLabel,
  toMonthKey,
} from "@/lib/utils/dashboardReconciliation";
import { getGSTPlanningEntry, upsertGSTPlanningEntry } from "@/lib/utils/gstPlanning";
import { InvoiceSettlementModal } from "@/components/operations/InvoiceSettlementModal";
import { POStatusModal } from "@/components/operations/POStatusModal";
import { GSTPlanningModal } from "@/components/operations/GSTPlanningModal";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { GSTPlanningEntry } from "@/lib/types/settings";
import { useToast } from "@/lib/hooks/useToast";

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
    <div className="rounded-bento flex min-h-[130px] flex-col justify-between p-6" style={{ background: accentBg, border: "1px solid var(--border)" }}>
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: accentText, opacity: 0.75 }}>
        {label}
      </p>
      <div>
        <div className="mt-3 font-mono text-2xl font-bold leading-none" style={{ color: accentText }}>
          {value}
        </div>
        {sub ? (
          <p className="mt-1.5 text-xs font-medium" style={{ color: accentText, opacity: 0.7 }}>
            {sub}
          </p>
        ) : null}
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
  const { invoices, loading: invLoading, saveInvoice } = useInvoices();
  const { purchaseOrders, loading: poLoading, savePurchaseOrder } = usePurchaseOrders();
  const { settings, saveSettings } = useSettings();
  const { profile } = useCompanyProfile();
  const { addToast } = useToast();
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [settlementInvoiceId, setSettlementInvoiceId] = useState<string | null>(null);
  const [poStatusId, setPoStatusId] = useState<string | null>(null);
  const [isGSTPlanningOpen, setIsGSTPlanningOpen] = useState(false);

  const monthOptions = useMemo(
    () => getAvailableMonths(invoices, purchaseOrders, settings),
    [invoices, purchaseOrders, settings],
  );

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

  const snapshot = useMemo(
    () => buildDashboardSnapshot(invoices, purchaseOrders, settings, selectedMonth || monthOptions[0] || toMonthKey(new Date().toISOString())),
    [invoices, purchaseOrders, settings, selectedMonth, monthOptions],
  );

  const settlementInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === settlementInvoiceId) ?? null,
    [invoices, settlementInvoiceId],
  );
  const statusPurchaseOrder = useMemo(
    () => purchaseOrders.find((po) => po.id === poStatusId) ?? null,
    [purchaseOrders, poStatusId],
  );
  const selectedPlanningRow = useMemo(
    () => snapshot.gstPlanningRows.find((row) => row.month === snapshot.selectedMonth),
    [snapshot],
  );
  const planningEntry = useMemo(
    () => getGSTPlanningEntry(settings?.gstPlanningEntries, snapshot.selectedMonth),
    [settings?.gstPlanningEntries, snapshot.selectedMonth],
  );

  const recent = useMemo(
    () =>
      [
        ...invoices.map((invoice) => ({
          id: invoice.id,
          type: "invoice" as const,
          number: invoice.invoiceNumber,
          party: invoice.buyer.name,
          date: invoice.invoiceDate,
          amount: invoice.totals.grandTotal,
        })),
        ...purchaseOrders.map((po) => ({
          id: po.id,
          type: "po" as const,
          number: po.poNumber,
          party: po.vendor.name,
          date: po.poDate,
          amount: po.totals.grandTotal,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [invoices, purchaseOrders],
  );

  const handleSettlementSave = async (invoice: Invoice) => {
    const result = await saveInvoice(invoice);
    return { success: result.success, error: result.error };
  };

  const handlePOStatusSave = async (po: PurchaseOrder) => {
    const result = await savePurchaseOrder(po);
    return { success: result.success, error: result.error };
  };

  const handleGSTPlanningSave = async (entry: GSTPlanningEntry) => {
    if (!settings) return;
    const nextSettings = {
      ...settings,
      gstPlanningEntries: upsertGSTPlanningEntry(settings.gstPlanningEntries, entry),
    };
    const result = await saveSettings(nextSettings);
    if (result.success) {
      addToast("GST planning updated.", "success");
      return;
    }
    addToast(result.error ?? "Failed to save GST planning.", "error");
  };

  if (invLoading || poLoading || !settings) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] p-5 md:p-7">
      {configured && !user && showSyncBanner ? (
        <div className="mb-5 rounded-bento px-5 py-4" style={{ background: "var(--accent-yellow-muted)", border: "1px solid var(--accent-yellow)" }}>
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
      ) : null}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
            {profile ? profile.companyName : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Cashflow and recovery view for {getMonthLabel(snapshot.selectedMonth)}
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
            value={snapshot.selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {monthOptions.length === 0 ? (
              <option value={snapshot.selectedMonth}>{getMonthLabel(snapshot.selectedMonth)}</option>
            ) : (
              monthOptions.map((month) => (
                <option key={month} value={month}>{getMonthLabel(month)}</option>
              ))
            )}
          </select>
          <Button variant="secondary" onClick={() => setIsGSTPlanningOpen(true)}>
            <Landmark className="h-4 w-4" />
            Update GST Plan
          </Button>
          <Button variant="secondary" onClick={() => exportDashboardWorkbook(snapshot.selectedMonth, snapshot)}>
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
          label="Base Cash Collected"
          value={formatCurrencyINR(snapshot.baseCashCollectedThisMonth)}
          sub={`${snapshot.openInvoicesAwaitingBaseClearance} invoices still awaiting base`}
          accentBg="var(--accent-mint-muted)"
          accentText="var(--accent-mint-text)"
        />
        <StatCard
          label="GST Recovered From Clients"
          value={formatCurrencyINR(snapshot.gstRecoveredThisMonth)}
          sub={`${snapshot.baseClearedGstPendingCount} invoices base-cleared but GST pending`}
          accentBg="var(--accent-purple)"
          accentText="#FFFFFF"
        />
        <StatCard
          label="GST Paid To Government"
          value={formatCurrencyINR(snapshot.gstPaidToGovernmentThisMonth)}
          sub={planningEntry?.gstPaidDate ? `Paid on ${planningEntry.gstPaidDate}` : "No payment recorded yet"}
          accentBg="var(--accent-coral)"
          accentText="#FFFFFF"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="GST Pending From Clients"
          value={formatCurrencyINR(snapshot.gstPendingFromClientsTotal)}
          accentBg="var(--surface)"
          accentText="var(--text-primary)"
        />
        <StatCard
          label="GST Payable Outstanding"
          value={formatCurrencyINR(snapshot.gstPayableOutstanding)}
          accentBg="var(--surface)"
          accentText="var(--text-primary)"
        />
        <StatCard
          label="Net Cash After GST"
          value={formatCurrencyINR(snapshot.netCashAfterGstOutflow)}
          accentBg="var(--surface)"
          accentText="var(--text-primary)"
        />
        <StatCard
          label="Overdue Base Collections"
          value={String(snapshot.overdueBaseCount)}
          accentBg="var(--surface)"
          accentText="var(--text-primary)"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                GST Planning
              </h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsGSTPlanningOpen(true)}>
              Edit Month
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Opening Payable", value: formatCurrencyINR(selectedPlanningRow?.openingGstPayable ?? 0) },
              { label: "Accrued This Month", value: formatCurrencyINR(selectedPlanningRow?.gstAccruedThisMonth ?? 0) },
              { label: "Recovered From Clients", value: formatCurrencyINR(selectedPlanningRow?.gstRecoveredFromClientsThisMonth ?? 0) },
              { label: "Closing Payable", value: formatCurrencyINR(selectedPlanningRow?.closingGstPayable ?? snapshot.gstPayableOutstanding) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </div>
                <div className="mt-2 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {item.value}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Pending Invoice Recovery
              </h2>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {snapshot.pendingInvoiceRows.length} open invoice follow-ups
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Invoice", "Client", "Base Pending", "GST Pending", "State", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.pendingInvoiceRows.slice(0, 8).map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3 font-mono text-xs text-slate-900">{row.invoiceNumber}</td>
                    <td className="px-3 py-3 text-slate-700">{row.client}</td>
                    <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.baseExpected - row.baseClearedAmount)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatCurrencyINR(row.gstPendingFromClient)}</td>
                    <td className="px-3 py-3">
                      <PaymentStatusBadge status={row.paymentStatus as Invoice["paymentStatus"]} />
                    </td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="secondary" onClick={() => setSettlementInvoiceId(row.id)}>
                        Update Settlement
                      </Button>
                    </td>
                  </tr>
                ))}
                {snapshot.pendingInvoiceRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                      No pending invoice recovery for this month.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptIndianRupee className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Recent
              </h2>
            </div>
            <Link href="/documents" className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--accent-yellow)" }}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recent.map((doc) => (
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
                <div className="ml-3">
                  <span className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatCurrencyINR(doc.amount)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Open PO Approvals
              </h2>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {snapshot.openPurchaseOrderRows.length} POs need follow-up
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["PO", "Vendor", "PO Status", "Status Date", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.openPurchaseOrderRows.slice(0, 8).map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3 font-mono text-xs text-slate-900">{row.poNumber}</td>
                    <td className="px-3 py-3 text-slate-700">{row.vendor}</td>
                    <td className="px-3 py-3"><POStatusBadge status={row.poStatus as PurchaseOrder["poStatus"]} /></td>
                    <td className="px-3 py-3 text-slate-700">{row.poStatusDate || "Pending"}</td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="secondary" onClick={() => setPoStatusId(row.id)}>
                        Update PO Status
                      </Button>
                    </td>
                  </tr>
                ))}
                {snapshot.openPurchaseOrderRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                      No open PO approvals for this month.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-bento p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Client GST Summary
          </h2>
          <div className="mt-4 space-y-3">
            {snapshot.clientSummaryRows.slice(0, 6).map((row) => (
              <div key={row.client} className="rounded-xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{row.client}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Pending base {formatCurrencyINR(row.pendingBaseAmount)} • Pending GST {formatCurrencyINR(row.pendingGstAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrencyINR(row.billedAmount)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {row.invoiceCount} invoice{row.invoiceCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <InvoiceSettlementModal
        invoice={settlementInvoice}
        open={Boolean(settlementInvoice)}
        onClose={() => setSettlementInvoiceId(null)}
        onSave={handleSettlementSave}
      />
      <POStatusModal
        purchaseOrder={statusPurchaseOrder}
        open={Boolean(statusPurchaseOrder)}
        onClose={() => setPoStatusId(null)}
        onSave={handlePOStatusSave}
      />
      <GSTPlanningModal
        month={snapshot.selectedMonth}
        open={isGSTPlanningOpen}
        entry={planningEntry}
        openingGstPayable={selectedPlanningRow?.openingGstPayable ?? 0}
        gstAccruedThisMonth={selectedPlanningRow?.gstAccruedThisMonth ?? 0}
        gstRecoveredFromClientsThisMonth={selectedPlanningRow?.gstRecoveredFromClientsThisMonth ?? 0}
        onClose={() => setIsGSTPlanningOpen(false)}
        onSave={handleGSTPlanningSave}
      />
    </div>
  );
}
