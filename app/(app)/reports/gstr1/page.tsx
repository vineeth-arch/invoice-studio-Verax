"use client";

import { useMemo, useState } from "react";
import { Download, FileArchive, TriangleAlert } from "lucide-react";
import { strToU8, zipSync } from "fflate";
import { Button } from "@/components/ui/Button";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useInvoices } from "@/lib/hooks/useInvoices";
import type { Invoice } from "@/lib/types/invoice";
import { formatCurrencyINR } from "@/lib/utils/formatting";
import { getDisplayInvoiceNumber } from "@/lib/utils/invoiceTypes";

const FINANCIAL_YEARS = ["2023-24", "2024-25", "2025-26"] as const;
const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
] as const;

type FinancialYear = typeof FINANCIAL_YEARS[number];
type FiscalMonth = typeof MONTHS[number];

type WarningItem = {
  id: string;
  message: string;
};

type SummaryKey = "B2B" | "B2C Large" | "B2C Small" | "Credit Notes" | "Export Invoices";

function formatCsvDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function csvEscape(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function makeCsv(header: string[], rows: Array<Array<string | number>>) {
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function downloadFile(filename: string, content: BlobPart | Uint8Array, type: string) {
  const normalizedContent = content instanceof Uint8Array
    ? (() => {
        const copy = new Uint8Array(content.byteLength);
        copy.set(content);
        return copy;
      })()
    : content;
  const blob = new Blob([normalizedContent], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function getPeriodBounds(financialYear: FinancialYear, month: FiscalMonth) {
  const [startYearLabel, endYearLabel] = financialYear.split("-");
  const startYear = Number(startYearLabel);
  const endYear = Number(`20${endYearLabel}`);
  const monthIndex = MONTHS.indexOf(month);
  const calendarMonthIndex = monthIndex <= 8 ? monthIndex + 3 : monthIndex - 9;
  const year = monthIndex <= 8 ? startYear : endYear;
  const periodStart = new Date(year, calendarMonthIndex, 1);
  const periodEnd = new Date(year, calendarMonthIndex + 1, 0);
  return { periodStart, periodEnd };
}

function isFinalExportableInvoice(invoice: Invoice) {
  return invoice.status === "FINAL" && invoice.invoiceType !== "PROFORMA";
}

function isInterState(invoice: Invoice) {
  return (invoice.supplier?.stateCode || invoice.supplier?.address?.stateCode) !== invoice.buyer?.placeOfSupplyCode;
}

function classifyInvoice(invoice: Invoice): SummaryKey {
  if (invoice.invoiceType === "CREDIT_NOTE") return "Credit Notes";
  if (invoice.invoiceType === "EXPORT_INVOICE") return "Export Invoices";
  if (invoice.buyer?.gstin?.trim()) return "B2B";
  if (isInterState(invoice) && Math.abs(invoice.totals?.grandTotal ?? 0) > 250000) return "B2C Large";
  return "B2C Small";
}

function formatPlaceOfSupply(invoice: Invoice) {
  const code = invoice.buyer?.placeOfSupplyCode?.trim();
  const place = invoice.buyer?.placeOfSupply?.trim();
  if (code && place) return `${code}-${place}`;
  return code || place || "";
}

function mapInvoiceType(invoice: Invoice) {
  switch (invoice.invoiceType) {
    case "DEBIT_NOTE":
      return "Debit Note";
    case "CREDIT_NOTE":
      return "Credit Note";
    case "EXPORT_INVOICE":
      return "Exports";
    default:
      return "Regular";
  }
}

export default function GSTR1ReportPage() {
  const { invoices, loading } = useInvoices();
  const { profile } = useCompanyProfile();
  const [financialYear, setFinancialYear] = useState<FinancialYear>("2025-26");
  const [month, setMonth] = useState<FiscalMonth>("April");
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);

  const { periodStart, periodEnd } = useMemo(
    () => getPeriodBounds(financialYear, month),
    [financialYear, month]
  );

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    if (!isFinalExportableInvoice(invoice)) return false;
    const invoiceDate = new Date(invoice.invoiceDate);
    return invoiceDate >= periodStart && invoiceDate <= periodEnd;
  }), [invoices, periodEnd, periodStart]);

  const summary = useMemo(() => {
    const base: Record<SummaryKey, { count: number; taxableValue: number }> = {
      B2B: { count: 0, taxableValue: 0 },
      "B2C Large": { count: 0, taxableValue: 0 },
      "B2C Small": { count: 0, taxableValue: 0 },
      "Credit Notes": { count: 0, taxableValue: 0 },
      "Export Invoices": { count: 0, taxableValue: 0 },
    };

    filteredInvoices.forEach((invoice) => {
      const key = classifyInvoice(invoice);
      base[key].count += 1;
      base[key].taxableValue += invoice.totals?.totalTaxableValue ?? 0;
    });

    return base;
  }, [filteredInvoices]);

  const warnings = useMemo<WarningItem[]>(() => {
    const items: WarningItem[] = [];

    filteredInvoices.forEach((invoice) => {
      const number = getDisplayInvoiceNumber(invoice);
      if (!invoice.buyer?.gstin?.trim() && classifyInvoice(invoice) !== "Export Invoices") {
        items.push({
          id: `gstin-${invoice.id}`,
          message: `${number} is missing buyer GSTIN and will not appear in the B2B export.`,
        });
      }

      if ((invoice.lineItems ?? []).some((item) => !item.hsnSac?.trim())) {
        items.push({
          id: `hsn-${invoice.id}`,
          message: `${number} has one or more line items without an HSN/SAC code.`,
        });
      }

      if (
        invoice.buyer?.placeOfSupplyCode?.trim() &&
        invoice.buyer?.billingAddress?.stateCode?.trim() &&
        invoice.buyer.placeOfSupplyCode.trim() !== invoice.buyer.billingAddress.stateCode.trim()
      ) {
        items.push({
          id: `pos-${invoice.id}`,
          message: `${number} has a place-of-supply code that does not match the buyer billing state code.`,
        });
      }
    });

    return items.filter((item) => !dismissedWarningIds.includes(item.id));
  }, [dismissedWarningIds, filteredInvoices]);

  const b2bCsv = useMemo(() => {
    const rows = filteredInvoices
      .filter((invoice) => classifyInvoice(invoice) === "B2B")
      .flatMap((invoice) => {
        const rateMap = new Map<number, number>();
        invoice.lineItems.forEach((item) => {
          rateMap.set(item.gstRate, (rateMap.get(item.gstRate) ?? 0) + item.taxableValue);
        });

        return Array.from(rateMap.entries()).map(([rate, taxableValue]) => [
          invoice.buyer.gstin ?? "",
          invoice.buyer.name,
          getDisplayInvoiceNumber(invoice),
          formatCsvDate(invoice.invoiceDate),
          invoice.totals.grandTotal.toFixed(2),
          formatPlaceOfSupply(invoice),
          invoice.reverseCharge ? "Y" : "N",
          mapInvoiceType(invoice),
          "",
          rate.toFixed(2),
          taxableValue.toFixed(2),
          invoice.totals.cess.toFixed(2),
        ]);
      });

    return makeCsv(
      [
        "GSTIN of Recipient",
        "Receiver Name",
        "Invoice Number",
        "Invoice Date",
        "Invoice Value",
        "Place of Supply",
        "Reverse Charge",
        "Invoice Type",
        "E-Commerce GSTIN",
        "Rate",
        "Taxable Value",
        "Cess Amount",
      ],
      rows
    );
  }, [filteredInvoices]);

  const b2cCsv = useMemo(() => {
    const aggregate = new Map<string, { type: string; pos: string; rate: number; taxableValue: number; cess: number }>();

    filteredInvoices
      .filter((invoice) => {
        const type = classifyInvoice(invoice);
        return type === "B2C Large" || type === "B2C Small";
      })
      .forEach((invoice) => {
        const type = classifyInvoice(invoice);
        invoice.lineItems.forEach((item) => {
          const key = `${type}-${formatPlaceOfSupply(invoice)}-${item.gstRate}`;
          const current = aggregate.get(key) ?? {
            type,
            pos: formatPlaceOfSupply(invoice),
            rate: item.gstRate,
            taxableValue: 0,
            cess: 0,
          };
          current.taxableValue += item.taxableValue;
          current.cess += invoice.totals.cess;
          aggregate.set(key, current);
        });
      });

    const rows = Array.from(aggregate.values()).map((entry) => [
      entry.type,
      entry.pos,
      "",
      entry.rate.toFixed(2),
      entry.taxableValue.toFixed(2),
      entry.cess.toFixed(2),
      "",
    ]);

    return makeCsv(
      [
        "Type",
        "Place of Supply",
        "Applicable % of Tax Rate",
        "Rate",
        "Taxable Value",
        "Cess Amount",
        "E-Commerce GSTIN",
      ],
      rows
    );
  }, [filteredInvoices]);

  const hsnCsv = useMemo(() => {
    const aggregate = new Map<string, {
      hsn: string;
      description: string;
      uom: string;
      quantity: number;
      totalValue: number;
      taxableValue: number;
      integratedTax: number;
      centralTax: number;
      stateTax: number;
      cess: number;
    }>();

    filteredInvoices.forEach((invoice) => {
      invoice.lineItems.forEach((item) => {
        const key = `${item.hsnSac}-${item.unit}-${item.description}`;
        const current = aggregate.get(key) ?? {
          hsn: item.hsnSac || "MISSING",
          description: item.description,
          uom: item.unit,
          quantity: 0,
          totalValue: 0,
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0,
          cess: 0,
        };

        current.quantity += item.quantity;
        current.totalValue += item.lineTotal;
        current.taxableValue += item.taxableValue;
        current.integratedTax += item.igst;
        current.centralTax += item.cgst;
        current.stateTax += item.sgst;
        current.cess += invoice.totals.cess;
        aggregate.set(key, current);
      });
    });

    const rows = Array.from(aggregate.values()).map((entry) => [
      entry.hsn,
      entry.description,
      entry.uom,
      entry.quantity.toFixed(2),
      entry.totalValue.toFixed(2),
      entry.taxableValue.toFixed(2),
      entry.integratedTax.toFixed(2),
      entry.centralTax.toFixed(2),
      entry.stateTax.toFixed(2),
      entry.cess.toFixed(2),
    ]);

    return makeCsv(
      [
        "HSN",
        "Description",
        "UOM",
        "Total Quantity",
        "Total Value",
        "Taxable Value",
        "Integrated Tax",
        "Central Tax",
        "State/UT Tax",
        "Cess",
      ],
      rows
    );
  }, [filteredInvoices]);

  const exportB2B = () => downloadFile(`gstr1-b2b-${month}-${financialYear}.csv`, b2bCsv, "text/csv;charset=utf-8;");
  const exportB2C = () => downloadFile(`gstr1-b2c-${month}-${financialYear}.csv`, b2cCsv, "text/csv;charset=utf-8;");
  const exportHSN = () => downloadFile(`gstr1-hsn-${month}-${financialYear}.csv`, hsnCsv, "text/csv;charset=utf-8;");

  const exportZip = () => {
    const zip = zipSync({
      [`gstr1-b2b-${month}-${financialYear}.csv`]: strToU8(b2bCsv),
      [`gstr1-b2c-${month}-${financialYear}.csv`]: strToU8(b2cCsv),
      [`gstr1-hsn-${month}-${financialYear}.csv`]: strToU8(hsnCsv),
    });

    const gstin = (profile?.gstin || "NA").replaceAll(/\s+/g, "");
    downloadFile(`GSTR1_${gstin}_${month}_${financialYear}.zip`, zip, "application/zip");
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading GSTR-1 export...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GSTR-1 Export</h1>
          <p className="text-sm text-slate-500">Filter final invoices by financial year and month, then export GST-ready CSV files.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Financial Year</span>
            <select
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value as FinancialYear)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {FINANCIAL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</span>
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value as FiscalMonth)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Section", "Count", "Total Taxable Value"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(Object.keys(summary) as SummaryKey[]).map((key) => (
              <tr key={key}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{key}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{summary[key].count}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{formatCurrencyINR(summary[key].taxableValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert className="h-4 w-4" />
            Validation warnings
          </div>
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div key={warning.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2">
                <p className="text-sm text-amber-900">{warning.message}</p>
                <button
                  type="button"
                  onClick={() => setDismissedWarningIds((current) => [...current, warning.id])}
                  className="text-xs font-medium text-amber-700 transition-opacity hover:opacity-75"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={exportB2B}>
          <Download className="h-4 w-4" />
          Export B2B CSV
        </Button>
        <Button variant="outline" onClick={exportB2C}>
          <Download className="h-4 w-4" />
          Export B2C CSV
        </Button>
        <Button variant="outline" onClick={exportHSN}>
          <Download className="h-4 w-4" />
          Export HSN Summary CSV
        </Button>
        <Button variant="secondary" onClick={exportZip}>
          <FileArchive className="h-4 w-4" />
          Export All (ZIP)
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">Selected Period</div>
        <p className="mt-1 text-sm text-slate-600">
          {periodStart.toLocaleDateString("en-IN")} to {periodEnd.toLocaleDateString("en-IN")} · {filteredInvoices.length} final invoice{filteredInvoices.length !== 1 ? "s" : ""} included
        </p>
      </div>
    </div>
  );
}
