"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { getAgingBucket, getDaysOutstanding, getInvoiceDueDate, type AgingBucket } from "@/lib/utils/aging";
import { getDisplayInvoiceNumber } from "@/lib/utils/invoiceTypes";
import { getEffectiveOutstanding } from "@/lib/utils/invoiceFinancials";

const BUCKETS: AgingBucket[] = ["Current", "0-30", "31-60", "61-90", "90+"];
const BUCKET_STYLES: Record<AgingBucket, string> = {
  Current: "bg-emerald-100 text-emerald-900 border-emerald-200",
  "0-30": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "31-60": "bg-orange-100 text-orange-900 border-orange-200",
  "61-90": "bg-rose-100 text-rose-900 border-rose-200",
  "90+": "bg-red-100 text-red-900 border-red-200",
};

export default function AgingReportPage() {
  const { invoices, loading } = useInvoices();

  const rows = useMemo(() => invoices
    .filter((invoice) => ["Unpaid", "Partial", "Overdue"].includes(invoice.paymentStatus))
    .map((invoice) => {
      const dueDate = getInvoiceDueDate(invoice);
      const daysOutstanding = getDaysOutstanding(invoice);
      return {
        id: invoice.id,
        invoiceNumber: getDisplayInvoiceNumber(invoice),
        client: invoice.buyer.name,
        invoiceDate: invoice.invoiceDate,
        dueDate: dueDate?.toISOString().slice(0, 10) ?? "",
        daysOutstanding,
        invoiceAmount: invoice.totals.grandTotal,
        received: invoice.paymentReceivedAmount ?? 0,
        outstanding: getEffectiveOutstanding(invoice),
        bucket: getAgingBucket(daysOutstanding),
      };
    }), [invoices]);

  const grouped = useMemo(() => BUCKETS.map((bucket) => ({
    bucket,
    rows: rows.filter((row) => row.bucket === bucket),
    total: rows.filter((row) => row.bucket === bucket).reduce((sum, row) => sum + row.outstanding, 0),
  })), [rows]);

  const exportCsv = () => {
    const header = ["Bucket", "Invoice No", "Client", "Invoice Date", "Due Date", "Days", "Invoice Amount", "Received", "Outstanding"];
    const csvRows = rows.map((row) => [
      row.bucket,
      row.invoiceNumber,
      row.client,
      row.invoiceDate,
      row.dueDate,
      row.daysOutstanding,
      row.invoiceAmount.toFixed(2),
      row.received.toFixed(2),
      row.outstanding.toFixed(2),
    ]);
    const csv = [header, ...csvRows].map((line) => line.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading aging report...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aging Report</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Button onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export as CSV
        </Button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {grouped.map(({ bucket, total }) => (
          <div key={bucket} className={`rounded-2xl border p-4 ${BUCKET_STYLES[bucket]}`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em]">{bucket}</div>
            <div className="mt-2 text-2xl font-bold">{formatCurrencyINR(total)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {grouped.map(({ bucket, rows: bucketRows, total }) => (
          <section key={bucket} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className={`flex items-center justify-between px-5 py-4 ${BUCKET_STYLES[bucket]}`}>
              <div className="text-sm font-semibold">{bucket}</div>
              <div className="text-sm font-semibold">{formatCurrencyINR(total)}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Invoice No", "Client", "Invoice Date", "Due Date", "Days", "Invoice Amount", "Received", "Outstanding"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bucketRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">No invoices in this bucket.</td>
                    </tr>
                  ) : (
                    bucketRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.client}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(row.invoiceDate)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(row.dueDate)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.daysOutstanding}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{formatCurrencyINR(row.invoiceAmount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatCurrencyINR(row.received)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrencyINR(row.outstanding)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Section subtotal</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrencyINR(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
