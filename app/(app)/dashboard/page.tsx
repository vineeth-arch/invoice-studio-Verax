"use client";

import Link from "next/link";
import { FileText, ShoppingCart, Building2, FolderOpen, TrendingUp, Clock, FileEdit } from "lucide-react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { PaymentStatusBadge, POStatusBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { invoices, loading: invLoading } = useInvoices();
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const { profile } = useCompanyProfile();

  const totalInvoiced = invoices.filter(i => i.status === "FINAL" || i.status === "PAID").reduce((s, i) => s + i.totals.grandTotal, 0);
  const totalPO = purchaseOrders.filter(p => p.status !== "CANCELLED").reduce((s, p) => s + p.totals.grandTotal, 0);
  const drafts = [...invoices, ...purchaseOrders].filter(d => d.status === "DRAFT").length;

  const recent = [
    ...invoices.map(i => ({ id: i.id, type: "invoice" as const, number: i.invoiceNumber, party: i.buyer.name, date: i.invoiceDate, amount: i.totals.grandTotal, status: i.status, paymentStatus: i.paymentStatus })),
    ...purchaseOrders.map(p => ({ id: p.id, type: "po" as const, number: p.poNumber, party: p.vendor.name, date: p.poDate, amount: p.totals.grandTotal, status: p.status, poStatus: p.poStatus })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (invLoading || poLoading) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {profile ? `Welcome, ${profile.companyName}` : "Dashboard"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link href="/invoice/new">
          <div className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors">
            <FileText className="h-6 w-6" />
            <span className="text-sm font-medium">New Invoice</span>
          </div>
        </Link>
        <Link href="/purchase-order/new">
          <div className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-sm font-medium">New PO</span>
          </div>
        </Link>
        <Link href="/documents">
          <div className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors">
            <FolderOpen className="h-6 w-6 text-slate-500" />
            <span className="text-sm font-medium">Documents</span>
          </div>
        </Link>
        <Link href="/company-profile">
          <div className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors">
            <Building2 className="h-6 w-6 text-slate-500" />
            <span className="text-sm font-medium">Company Profile</span>
          </div>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Invoiced" value={formatCurrencyINR(totalInvoiced)} icon={TrendingUp} color="bg-green-500" />
        <SummaryCard label="Total PO Value" value={formatCurrencyINR(totalPO)} icon={ShoppingCart} color="bg-purple-500" />
        <SummaryCard label="Total Invoices" value={invoices.length} sub={`${invoices.filter(i => i.status === "DRAFT").length} drafts`} icon={FileText} color="bg-brand-500" />
        <SummaryCard label="Drafts" value={drafts} icon={FileEdit} color="bg-amber-500" />
      </div>

      {/* Recent documents */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Recent Documents</h2>
          </div>
          <Link href="/documents">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No documents yet. Create your first invoice or purchase order.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((doc) => (
              <Link key={doc.id} href={`/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs rounded px-2 py-0.5 font-medium ${doc.type === "invoice" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {doc.type === "invoice" ? "INV" : "PO"}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{doc.number}</div>
                    <div className="text-xs text-slate-400">{doc.party}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-800">{formatCurrencyINR(doc.amount)}</div>
                    <div className="text-xs text-slate-400">{formatDate(doc.date)}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge status={doc.status} />
                    {doc.type === "invoice" && doc.paymentStatus && <PaymentStatusBadge status={doc.paymentStatus} />}
                    {doc.type === "po" && doc.poStatus && <POStatusBadge status={doc.poStatus} />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!profile && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-amber-800">Set up your company profile</div>
            <div className="text-xs text-amber-600">Prefill your details automatically in every invoice and PO</div>
          </div>
          <Link href="/company-profile">
            <Button size="sm" variant="secondary">Set up now</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
