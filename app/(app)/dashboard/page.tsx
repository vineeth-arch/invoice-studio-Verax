"use client";

import Link from "next/link";
import {
  FileText,
  ShoppingCart,
  Users,
  BriefcaseBusiness,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { formatCurrencyINR } from "@/lib/utils/formatting";
import { StatusBadge } from "@/components/ui/Badge";

/* ── Bento stat card ── */
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
      className="rounded-bento p-6 flex flex-col justify-between min-h-[130px]"
      style={{ background: accentBg, border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: accentText, opacity: 0.75 }}>
        {label}
      </p>
      <div>
        <div className="font-mono text-2xl font-bold leading-none mt-3" style={{ color: accentText }}>
          {value}
        </div>
        {sub && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: accentText, opacity: 0.65 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Quick action pill button ── */
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
        className="flex items-center gap-3 px-5 py-3.5 rounded-[24px] font-medium text-sm transition-transform duration-150 hover:scale-[1.02] cursor-pointer"
        style={{ background: bg, color: fg }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { invoices, loading: invLoading } = useInvoices();
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const { profile } = useCompanyProfile();

  const finalInvoices = invoices.filter((i) => i.status === "FINAL" || i.status === "PAID");
  const totalInvoiced = finalInvoices.reduce((s, i) => s + i.totals.grandTotal, 0);

  const outstandingInvoices = invoices.filter(
    (i) => i.status === "FINAL" && i.paymentStatus !== "Paid"
  );
  const outstandingAmt = outstandingInvoices.reduce((s, i) => s + i.totals.grandTotal, 0);

  const overdueInvoices = invoices.filter((i) => i.paymentStatus === "Overdue");
  const overdueAmt = overdueInvoices.reduce((s, i) => s + i.totals.grandTotal, 0);

  const unpaidInvoices = invoices.filter((i) => i.paymentStatus === "Unpaid" || i.paymentStatus === "Partial");
  const unpaidAmt = unpaidInvoices.reduce((s, i) => s + i.totals.grandTotal, 0);

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
      paymentStatus: i.paymentStatus,
      poStatus: undefined as undefined,
    })),
    ...purchaseOrders.map((p) => ({
      id: p.id,
      type: "po" as const,
      number: p.poNumber,
      party: p.vendor.name,
      date: p.poDate,
      amount: p.totals.grandTotal,
      status: p.status,
      paymentStatus: undefined as undefined,
      poStatus: p.poStatus,
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
    <div className="p-5 md:p-7 max-w-[1200px]">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
          {profile ? profile.companyName : "Dashboard"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <div className="bento-grid">

        {/* Stat 1 — Total Invoiced (yellow) */}
        <div style={{ gridArea: "stat1" }}>
          <StatCard
            label="Total Invoiced"
            value={formatCurrencyINR(totalInvoiced)}
            sub={`${finalInvoices.length} final invoices`}
            accentBg="var(--accent-yellow)"
            accentText="#111111"
          />
        </div>

        {/* Stat 2 — Outstanding (purple) */}
        <div style={{ gridArea: "stat2" }}>
          <StatCard
            label="Outstanding"
            value={formatCurrencyINR(outstandingAmt)}
            sub={`${outstandingInvoices.length} pending payment`}
            accentBg="var(--accent-purple)"
            accentText="#FFFFFF"
          />
        </div>

        {/* Stat 3 — Overdue (coral) */}
        <div style={{ gridArea: "stat3" }}>
          <StatCard
            label="Overdue"
            value={formatCurrencyINR(overdueAmt)}
            sub={`${overdueInvoices.length} overdue invoices`}
            accentBg="var(--accent-coral)"
            accentText="#FFFFFF"
          />
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-bento p-6 flex flex-col gap-3"
          style={{ gridArea: "actions", background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-display font-bold text-[18px] mb-1" style={{ color: "var(--text-primary)" }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionPill
              href="/invoice/new"
              icon={FileText}
              label="New Invoice"
              bg="var(--accent-yellow)"
              fg="#111111"
            />
            <ActionPill
              href="/purchase-order/new"
              icon={ShoppingCart}
              label="New PO"
              bg="var(--accent-purple)"
              fg="#FFFFFF"
            />
            <ActionPill
              href="/clients"
              icon={Users}
              label="New Client"
              bg="var(--accent-mint-muted)"
              fg="var(--accent-mint-text)"
            />
            <ActionPill
              href="/services"
              icon={BriefcaseBusiness}
              label="New Service"
              bg="var(--accent-coral-muted)"
              fg="var(--accent-coral-text)"
            />
          </div>
        </div>

        {/* Recent Documents */}
        <div
          className="rounded-bento p-6 flex flex-col gap-3 overflow-hidden"
          style={{ gridArea: "recent", background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="font-display font-bold text-[18px]" style={{ color: "var(--text-primary)" }}>
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

          {recent.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
              No documents yet.
            </p>
          ) : (
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 260 }}>
              {recent.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-theme-surface-raised group"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        background: doc.type === "invoice" ? "var(--accent-yellow-muted)" : "var(--accent-purple-muted)",
                        color: doc.type === "invoice" ? "var(--accent-yellow-text)" : "var(--accent-purple-text)",
                      }}
                    >
                      {doc.type === "invoice" ? "INV" : "PO"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {doc.number}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                        {doc.party}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatCurrencyINR(doc.amount)}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div
          className="rounded-bento p-6 flex flex-col justify-between"
          style={{ gridArea: "unpaid", background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="font-display font-bold text-[18px]" style={{ color: "var(--text-primary)" }}>
              Unpaid
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Invoices pending payment
            </p>
          </div>
          <div className="mt-4">
            <div className="font-mono text-3xl font-bold" style={{ color: "var(--accent-yellow)" }}>
              {unpaidInvoices.length}
            </div>
            <div className="font-mono text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {formatCurrencyINR(unpaidAmt)}
            </div>
          </div>
        </div>

        {/* PO Status Summary */}
        <div
          className="rounded-bento p-6"
          style={{ gridArea: "po-summary", background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-display font-bold text-[18px] mb-4" style={{ color: "var(--text-primary)" }}>
            PO Status Summary
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Under Approval", count: poUnderApproval, bg: "var(--accent-yellow-muted)", fg: "var(--accent-yellow-text)" },
              { label: "Approved", count: poApproved, bg: "var(--accent-mint-muted)", fg: "var(--accent-mint-text)" },
              { label: "Processed", count: poProcessed, bg: "var(--accent-purple-muted)", fg: "var(--accent-purple-text)" },
            ].map(({ label, count, bg, fg }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg }}>
                <div className="font-mono text-2xl font-bold" style={{ color: fg }}>{count}</div>
                <div className="text-[11px] font-medium mt-1" style={{ color: fg, opacity: 0.8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Company profile prompt */}
      {!profile && (
        <div
          className="mt-5 rounded-bento px-6 py-5 flex items-center justify-between"
          style={{ background: "var(--accent-yellow-muted)", border: "1px solid var(--accent-yellow)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent-yellow-text)" }}>
              Set up your company profile
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--accent-yellow-text)", opacity: 0.75 }}>
              Prefill your details automatically in every invoice and PO
            </p>
          </div>
          <Link
            href="/company-profile"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--accent-yellow)", color: "#111111" }}
          >
            Set up now
          </Link>
        </div>
      )}
    </div>
  );
}
