import { utils, writeFileXLSX } from "xlsx";
import type { Invoice } from "@/lib/types/invoice";
import { getBaseClearedAmount, getBaseExpectedAmount, getBasePendingAmount, getGstPendingAmount, getInvoiceClearedDate, getInvoiceGstAmount, hasTaxOnInvoice, normalizeInvoiceSettlement } from "./invoiceClearance";
import { getDisplayInvoiceNumber } from "./invoiceTypes";

export type InvoiceRegisterRow = {
  id: string;
  invoiceNumber: string;
  client: string;
  invoiceDate: string;
  grandTotal: number;
  taxableValue: number;
  gstAmount: number;
  baseExpected: number;
  baseClearedAmount: number;
  baseClearedDate: string;
  gstCollectionMode: string;
  gstClearedAmount: number;
  gstClearedDate: string;
  gstPending: number;
  invoiceClearedDate: string;
  tdsAmount: number;
  paymentStatus: string;
  settlementNotes: string;
};

export type ClientSummaryRow = {
  client: string;
  billedAmount: number;
  baseClearedAmount: number;
  gstClearedAmount: number;
  pendingBaseAmount: number;
  pendingGstAmount: number;
  invoiceCount: number;
};

export type DashboardSnapshot = {
  invoiceRegisterRows: InvoiceRegisterRow[];
  clearanceRows: InvoiceRegisterRow[];
  deferredRows: InvoiceRegisterRow[];
  clientSummaryRows: ClientSummaryRow[];
  deferredGstPendingTotal: number;
  billedThisMonth: number;
  baseClearedThisMonth: number;
  gstClearedThisMonth: number;
  fullyClearedValueThisMonth: number;
  fullyClearedCountThisMonth: number;
  deferredOpeningPending: number;
  deferredClosingPending: number;
  avgBaseClearanceDays: number;
  avgFullClearanceDays: number;
  awaitingGstCount: number;
  basePaidGstPendingCount: number;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

export function toMonthKey(date?: string) {
  return date && date.length >= 7 ? date.slice(0, 7) : "";
}

export function getMonthLabel(month: string) {
  if (!month) return "Select month";
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function isFinalInvoice(invoice: Invoice) {
  return invoice.status === "FINAL" || invoice.status === "PAID";
}

function monthMatches(date: string | undefined, month: string) {
  return toMonthKey(date) === month;
}

function diffDays(start?: string, end?: string) {
  if (!start || !end) return null;
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.max(Math.round((to.getTime() - from.getTime()) / 86400000), 0);
}

function buildRow(invoice: Invoice): InvoiceRegisterRow {
  const normalized = normalizeInvoiceSettlement(invoice);
  return {
    id: normalized.id,
    invoiceNumber: getDisplayInvoiceNumber(normalized),
    client: normalized.buyer.name,
    invoiceDate: normalized.invoiceDate,
    grandTotal: normalized.totals.grandTotal,
    taxableValue: normalized.totals.totalTaxableValue,
    gstAmount: getInvoiceGstAmount(normalized),
    baseExpected: getBaseExpectedAmount(normalized),
    baseClearedAmount: getBaseClearedAmount(normalized),
    baseClearedDate: normalized.baseClearedDate ?? "",
    gstCollectionMode: normalized.gstCollectionMode,
    gstClearedAmount: normalized.gstClearedAmount,
    gstClearedDate: normalized.gstClearedDate ?? "",
    gstPending: getGstPendingAmount(normalized),
    invoiceClearedDate: getInvoiceClearedDate(normalized) ?? "",
    tdsAmount: normalized.tdsAmount,
    paymentStatus: normalized.paymentStatus,
    settlementNotes: normalized.settlementNotes ?? "",
  };
}

export function getAvailableMonths(invoices: Invoice[]) {
  const months = new Set<string>();
  invoices
    .filter(isFinalInvoice)
    .forEach((invoice) => {
      const normalized = normalizeInvoiceSettlement(invoice);
      [normalized.invoiceDate, normalized.baseClearedDate, normalized.gstClearedDate, normalized.invoiceClearedDate]
        .map((date) => toMonthKey(date))
        .filter(Boolean)
        .forEach((month) => months.add(month));
    });

  return Array.from(months).sort().reverse();
}

export function buildDashboardSnapshot(invoices: Invoice[], month: string): DashboardSnapshot {
  const finalInvoices = invoices.filter(isFinalInvoice).map((invoice) => normalizeInvoiceSettlement(invoice));
  const invoiceRegisterRows = finalInvoices
    .filter((invoice) => monthMatches(invoice.invoiceDate, month))
    .map(buildRow);

  const clearanceRows = finalInvoices
    .filter((invoice) =>
      monthMatches(invoice.baseClearedDate, month) ||
      monthMatches(invoice.gstClearedDate, month) ||
      monthMatches(invoice.invoiceClearedDate, month)
    )
    .map(buildRow);

  const deferredRows = finalInvoices
    .filter((invoice) => invoice.gstCollectionMode === "deferred" || getGstPendingAmount(invoice) > 0)
    .map(buildRow);

  const deferredGstPendingTotal = round2(deferredRows.reduce((sum, row) => sum + row.gstPending, 0));
  const billedThisMonth = round2(invoiceRegisterRows.reduce((sum, row) => sum + row.grandTotal, 0));
  const baseClearedThisMonth = round2(
    clearanceRows
      .filter((row) => monthMatches(row.baseClearedDate, month))
      .reduce((sum, row) => sum + row.baseClearedAmount, 0)
  );
  const gstClearedThisMonth = round2(
    clearanceRows
      .filter((row) => monthMatches(row.gstClearedDate, month))
      .reduce((sum, row) => sum + row.gstClearedAmount, 0)
  );

  const fullyClearedRows = clearanceRows.filter((row) => monthMatches(row.invoiceClearedDate, month));
  const fullyClearedValueThisMonth = round2(fullyClearedRows.reduce((sum, row) => sum + row.grandTotal, 0));
  const fullyClearedCountThisMonth = fullyClearedRows.length;

  const deferredOpeningPending = round2(
    finalInvoices.reduce((sum, invoice) => {
      if (invoice.gstCollectionMode !== "deferred") return sum;
      if (!invoice.invoiceDate || invoice.invoiceDate.slice(0, 7) >= month) return sum;
      if (invoice.gstClearedDate && invoice.gstClearedDate.slice(0, 7) < month) return sum;
      return sum + getInvoiceGstAmount(invoice);
    }, 0)
  );

  const deferredClosingPending = round2(
    finalInvoices.reduce((sum, invoice) => {
      if (invoice.gstCollectionMode !== "deferred") return sum;
      return sum + getGstPendingAmount(invoice);
    }, 0)
  );

  const baseDelayValues = finalInvoices
    .map((invoice) => diffDays(invoice.invoiceDate, invoice.baseClearedDate))
    .filter((value): value is number => value !== null);
  const fullDelayValues = finalInvoices
    .map((invoice) => diffDays(invoice.invoiceDate, getInvoiceClearedDate(invoice)))
    .filter((value): value is number => value !== null);

  const avgBaseClearanceDays = baseDelayValues.length
    ? round2(baseDelayValues.reduce((sum, value) => sum + value, 0) / baseDelayValues.length)
    : 0;
  const avgFullClearanceDays = fullDelayValues.length
    ? round2(fullDelayValues.reduce((sum, value) => sum + value, 0) / fullDelayValues.length)
    : 0;

  const awaitingGstCount = finalInvoices.filter((invoice) => hasTaxOnInvoice(invoice) && getGstPendingAmount(invoice) > 0).length;
  const basePaidGstPendingCount = finalInvoices.filter((invoice) => getBasePendingAmount(invoice) <= 0.01 && getGstPendingAmount(invoice) > 0).length;

  const clientMap = new Map<string, ClientSummaryRow>();
  finalInvoices.forEach((invoice) => {
    const normalized = normalizeInvoiceSettlement(invoice);
    const row = clientMap.get(normalized.buyer.name) ?? {
      client: normalized.buyer.name,
      billedAmount: 0,
      baseClearedAmount: 0,
      gstClearedAmount: 0,
      pendingBaseAmount: 0,
      pendingGstAmount: 0,
      invoiceCount: 0,
    };

    if (monthMatches(normalized.invoiceDate, month)) {
      row.billedAmount += normalized.totals.grandTotal;
      row.invoiceCount += 1;
    }
    if (monthMatches(normalized.baseClearedDate, month)) {
      row.baseClearedAmount += getBaseClearedAmount(normalized);
    }
    if (monthMatches(normalized.gstClearedDate, month)) {
      row.gstClearedAmount += normalized.gstClearedAmount;
    }
    row.pendingBaseAmount += getBasePendingAmount(normalized);
    row.pendingGstAmount += getGstPendingAmount(normalized);
    clientMap.set(normalized.buyer.name, row);
  });

  const clientSummaryRows = Array.from(clientMap.values())
    .map((row) => ({
      ...row,
      billedAmount: round2(row.billedAmount),
      baseClearedAmount: round2(row.baseClearedAmount),
      gstClearedAmount: round2(row.gstClearedAmount),
      pendingBaseAmount: round2(row.pendingBaseAmount),
      pendingGstAmount: round2(row.pendingGstAmount),
    }))
    .filter((row) => row.invoiceCount > 0 || row.baseClearedAmount > 0 || row.gstClearedAmount > 0 || row.pendingGstAmount > 0)
    .sort((a, b) => b.pendingGstAmount - a.pendingGstAmount);

  return {
    invoiceRegisterRows,
    clearanceRows,
    deferredRows,
    clientSummaryRows,
    deferredGstPendingTotal,
    billedThisMonth,
    baseClearedThisMonth,
    gstClearedThisMonth,
    fullyClearedValueThisMonth,
    fullyClearedCountThisMonth,
    deferredOpeningPending,
    deferredClosingPending,
    avgBaseClearanceDays,
    avgFullClearanceDays,
    awaitingGstCount,
    basePaidGstPendingCount,
  };
}

function appendSheet(workbook: ReturnType<typeof utils.book_new>, name: string, rows: Array<Record<string, unknown>>) {
  const sheet = rows.length > 0 ? utils.json_to_sheet(rows) : utils.json_to_sheet([{ Notice: "No data available for this month." }]);
  utils.book_append_sheet(workbook, sheet, name);
}

export function exportDashboardWorkbook(month: string, snapshot: DashboardSnapshot) {
  const workbook = utils.book_new();
  const summaryRows = [
    { Metric: "Month", Value: getMonthLabel(month) },
    { Metric: "Billed in month", Value: snapshot.billedThisMonth },
    { Metric: "Base cleared in month", Value: snapshot.baseClearedThisMonth },
    { Metric: "GST cleared in month", Value: snapshot.gstClearedThisMonth },
    { Metric: "Deferred GST pending opening", Value: snapshot.deferredOpeningPending },
    { Metric: "Deferred GST pending closing", Value: snapshot.deferredClosingPending },
    { Metric: "Fully cleared invoices count", Value: snapshot.fullyClearedCountThisMonth },
    { Metric: "Fully cleared invoices value", Value: snapshot.fullyClearedValueThisMonth },
    { Metric: "Awaiting GST clearance", Value: snapshot.awaitingGstCount },
    { Metric: "Base paid, GST pending", Value: snapshot.basePaidGstPendingCount },
    { Metric: "Average base clearance days", Value: snapshot.avgBaseClearanceDays },
    { Metric: "Average full clearance days", Value: snapshot.avgFullClearanceDays },
  ];

  appendSheet(workbook, "Summary", summaryRows);
  appendSheet(workbook, "Invoice Register", snapshot.invoiceRegisterRows);
  appendSheet(workbook, "Clearance Register", snapshot.clearanceRows);
  appendSheet(workbook, "Deferred GST Tracker", snapshot.deferredRows);
  appendSheet(workbook, "Client Summary", snapshot.clientSummaryRows);

  writeFileXLSX(workbook, `reconciliation-${month}.xlsx`);
}
