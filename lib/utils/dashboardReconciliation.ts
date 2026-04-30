import { utils, writeFileXLSX } from "xlsx";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { Invoice } from "@/lib/types/invoice";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import {
  deriveCollectionState,
  getBaseClearedAmount,
  getBaseExpectedAmount,
  getBasePendingAmount,
  getGstPendingFromClient,
  getGstRecoveredAmount,
  getInvoiceClearedDate,
  getInvoiceGstAmount,
  normalizeInvoiceSettlement,
} from "./invoiceClearance";
import { getDisplayInvoiceNumber } from "./invoiceTypes";
import { getGSTPlanningEntry, normalizeGSTPlanningEntries } from "./gstPlanning";

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
  gstRecoveredAmount: number;
  gstRecoveredDate: string;
  gstPendingFromClient: number;
  invoiceClearedDate: string;
  tdsAmount: number;
  paymentStatus: string;
  collectionState: string;
  settlementNotes: string;
};

export type POStatusRow = {
  id: string;
  poNumber: string;
  vendor: string;
  poDate: string;
  status: string;
  poStatus: string;
  poStatusDate: string;
  poStatusNote: string;
  amount: number;
};

export type ClientSummaryRow = {
  client: string;
  billedAmount: number;
  baseClearedAmount: number;
  gstRecoveredAmount: number;
  pendingBaseAmount: number;
  pendingGstAmount: number;
  invoiceCount: number;
};

export type GSTPlanningRow = {
  month: string;
  label: string;
  openingGstPayable: number;
  gstAccruedThisMonth: number;
  gstRecoveredFromClientsThisMonth: number;
  gstPaidToGovernment: number;
  gstPaidDate: string;
  closingGstPayable: number;
  notes: string;
};

export type DashboardSnapshot = {
  selectedMonth: string;
  invoiceRegisterRows: InvoiceRegisterRow[];
  settlementRows: InvoiceRegisterRow[];
  pendingInvoiceRows: InvoiceRegisterRow[];
  openPurchaseOrderRows: POStatusRow[];
  poStatusRows: POStatusRow[];
  clientSummaryRows: ClientSummaryRow[];
  gstPlanningRows: GSTPlanningRow[];
  billedThisMonth: number;
  baseCashCollectedThisMonth: number;
  gstRecoveredThisMonth: number;
  gstPaidToGovernmentThisMonth: number;
  gstPendingFromClientsTotal: number;
  gstPayableOutstanding: number;
  netCashAfterGstOutflow: number;
  openInvoicesAwaitingBaseClearance: number;
  baseClearedGstPendingCount: number;
  overdueBaseCount: number;
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

function monthMatches(date: string | undefined, month: string) {
  return toMonthKey(date) === month;
}

function isFinalInvoice(invoice: Invoice) {
  return invoice.status === "FINAL" || invoice.status === "PAID";
}

function isOperationalPO(po: PurchaseOrder) {
  return po.status !== "DRAFT" && po.status !== "CANCELLED";
}

function buildInvoiceRow(invoice: Invoice): InvoiceRegisterRow {
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
    gstRecoveredAmount: getGstRecoveredAmount(normalized),
    gstRecoveredDate: normalized.gstRecoveredDate ?? "",
    gstPendingFromClient: getGstPendingFromClient(normalized),
    invoiceClearedDate: getInvoiceClearedDate(normalized) ?? "",
    tdsAmount: normalized.tdsAmount,
    paymentStatus: normalized.paymentStatus,
    collectionState: deriveCollectionState(normalized),
    settlementNotes: normalized.settlementNotes ?? "",
  };
}

function buildPORow(po: PurchaseOrder): POStatusRow {
  return {
    id: po.id,
    poNumber: po.poNumber,
    vendor: po.vendor.name,
    poDate: po.poDate,
    status: po.status,
    poStatus: po.poStatus,
    poStatusDate: po.poStatusDate ?? "",
    poStatusNote: po.poStatusNote ?? "",
    amount: po.totals.grandTotal,
  };
}

function monthSum(rows: Invoice[], month: string, selector: (invoice: Invoice) => number, dateSelector: (invoice: Invoice) => string | undefined) {
  return round2(
    rows
      .filter((invoice) => monthMatches(dateSelector(invoice), month))
      .reduce((sum, invoice) => sum + selector(invoice), 0)
  );
}

function appendSheet(workbook: ReturnType<typeof utils.book_new>, name: string, rows: Array<Record<string, unknown>>) {
  const sheet = rows.length > 0 ? utils.json_to_sheet(rows) : utils.json_to_sheet([{ Notice: "No data available for this month." }]);
  utils.book_append_sheet(workbook, sheet, name);
}

export function getAvailableMonths(
  invoices: Invoice[],
  purchaseOrders: PurchaseOrder[] = [],
  settings?: DocumentTemplateSettings | null,
) {
  const months = new Set<string>();

  invoices
    .filter(isFinalInvoice)
    .map((invoice) => normalizeInvoiceSettlement(invoice))
    .forEach((invoice) => {
      [invoice.invoiceDate, invoice.baseClearedDate, invoice.gstRecoveredDate, invoice.invoiceClearedDate]
        .map((date) => toMonthKey(date))
        .filter(Boolean)
        .forEach((month) => months.add(month));
    });

  purchaseOrders
    .filter(isOperationalPO)
    .forEach((po) => {
      [po.poDate, po.poStatusDate].map((date) => toMonthKey(date)).filter(Boolean).forEach((month) => months.add(month));
    });

  normalizeGSTPlanningEntries(settings?.gstPlanningEntries).forEach((entry) => months.add(entry.month));

  return Array.from(months).sort().reverse();
}

export function buildDashboardSnapshot(
  invoices: Invoice[],
  purchaseOrders: PurchaseOrder[],
  settings: DocumentTemplateSettings | null,
  month: string,
): DashboardSnapshot {
  const finalInvoices = invoices.filter(isFinalInvoice).map((invoice) => normalizeInvoiceSettlement(invoice));
  const operationalPOs = purchaseOrders.filter(isOperationalPO);
  const gstPlanningEntries = normalizeGSTPlanningEntries(settings?.gstPlanningEntries);

  const invoiceRegisterRows = finalInvoices
    .filter((invoice) => monthMatches(invoice.invoiceDate, month))
    .map(buildInvoiceRow);

  const settlementRows = finalInvoices
    .filter((invoice) =>
      monthMatches(invoice.baseClearedDate, month) ||
      monthMatches(invoice.gstRecoveredDate, month) ||
      monthMatches(invoice.invoiceDate, month)
    )
    .map(buildInvoiceRow);

  const pendingInvoiceRows = finalInvoices
    .filter((invoice) => getBasePendingAmount(invoice) > 0.01 || getGstPendingFromClient(invoice) > 0.01)
    .map(buildInvoiceRow)
    .sort((a, b) => {
      if (b.baseExpected !== a.baseExpected) return b.baseExpected - a.baseExpected;
      return a.invoiceDate.localeCompare(b.invoiceDate);
    });

  const openPurchaseOrderRows = operationalPOs
    .filter((po) => po.poStatus === "Under Approval" || po.poStatus === "Approved")
    .map(buildPORow)
    .sort((a, b) => b.poDate.localeCompare(a.poDate));

  const poStatusRows = operationalPOs.map(buildPORow).sort((a, b) => b.poDate.localeCompare(a.poDate));

  const billedThisMonth = round2(invoiceRegisterRows.reduce((sum, row) => sum + row.grandTotal, 0));
  const baseCashCollectedThisMonth = monthSum(finalInvoices, month, getBaseClearedAmount, (invoice) => invoice.baseClearedDate);
  const gstRecoveredThisMonth = monthSum(finalInvoices, month, getGstRecoveredAmount, (invoice) => invoice.gstRecoveredDate);
  const gstPaidToGovernmentThisMonth = getGSTPlanningEntry(gstPlanningEntries, month)?.gstPaidToGovernment ?? 0;
  const gstPendingFromClientsTotal = round2(finalInvoices.reduce((sum, invoice) => sum + getGstPendingFromClient(invoice), 0));

  const totalAccruedAcrossMonths = round2(finalInvoices.reduce((sum, invoice) => sum + getInvoiceGstAmount(invoice), 0));
  const totalPaidAcrossMonths = round2(gstPlanningEntries.reduce((sum, entry) => sum + entry.gstPaidToGovernment, 0));
  const gstPayableOutstanding = round2(Math.max(totalAccruedAcrossMonths - totalPaidAcrossMonths, 0));

  const allMonths = new Set<string>([
    ...finalInvoices.map((invoice) => toMonthKey(invoice.invoiceDate)).filter(Boolean),
    ...gstPlanningEntries.map((entry) => entry.month),
  ]);

  const gstPlanningRows = Array.from(allMonths)
    .sort()
    .reverse()
    .map((entryMonth) => {
      const accruedThisMonth = round2(
        finalInvoices
          .filter((invoice) => monthMatches(invoice.invoiceDate, entryMonth))
          .reduce((sum, invoice) => sum + getInvoiceGstAmount(invoice), 0)
      );
      const recoveredThisMonth = round2(
        finalInvoices
          .filter((invoice) => monthMatches(invoice.gstRecoveredDate, entryMonth))
          .reduce((sum, invoice) => sum + getGstRecoveredAmount(invoice), 0)
      );
      const planningEntry = getGSTPlanningEntry(gstPlanningEntries, entryMonth);
      const opening = round2(
        Math.max(
          finalInvoices
            .filter((invoice) => toMonthKey(invoice.invoiceDate) < entryMonth)
            .reduce((sum, invoice) => sum + getInvoiceGstAmount(invoice), 0) -
            gstPlanningEntries
              .filter((entry) => entry.month < entryMonth)
              .reduce((sum, entry) => sum + entry.gstPaidToGovernment, 0),
          0
        )
      );
      return {
        month: entryMonth,
        label: getMonthLabel(entryMonth),
        openingGstPayable: opening,
        gstAccruedThisMonth: accruedThisMonth,
        gstRecoveredFromClientsThisMonth: recoveredThisMonth,
        gstPaidToGovernment: planningEntry?.gstPaidToGovernment ?? 0,
        gstPaidDate: planningEntry?.gstPaidDate ?? "",
        closingGstPayable: round2(Math.max(opening + accruedThisMonth - (planningEntry?.gstPaidToGovernment ?? 0), 0)),
        notes: planningEntry?.notes ?? "",
      };
    });

  const clientMap = new Map<string, ClientSummaryRow>();
  finalInvoices.forEach((invoice) => {
    const client = invoice.buyer.name;
    const current = clientMap.get(client) ?? {
      client,
      billedAmount: 0,
      baseClearedAmount: 0,
      gstRecoveredAmount: 0,
      pendingBaseAmount: 0,
      pendingGstAmount: 0,
      invoiceCount: 0,
    };
    if (monthMatches(invoice.invoiceDate, month)) {
      current.billedAmount += invoice.totals.grandTotal;
      current.invoiceCount += 1;
    }
    if (monthMatches(invoice.baseClearedDate, month)) {
      current.baseClearedAmount += getBaseClearedAmount(invoice);
    }
    if (monthMatches(invoice.gstRecoveredDate, month)) {
      current.gstRecoveredAmount += getGstRecoveredAmount(invoice);
    }
    current.pendingBaseAmount += getBasePendingAmount(invoice);
    current.pendingGstAmount += getGstPendingFromClient(invoice);
    clientMap.set(client, current);
  });

  const clientSummaryRows = Array.from(clientMap.values())
    .map((row) => ({
      ...row,
      billedAmount: round2(row.billedAmount),
      baseClearedAmount: round2(row.baseClearedAmount),
      gstRecoveredAmount: round2(row.gstRecoveredAmount),
      pendingBaseAmount: round2(row.pendingBaseAmount),
      pendingGstAmount: round2(row.pendingGstAmount),
    }))
    .filter((row) => row.invoiceCount > 0 || row.pendingBaseAmount > 0 || row.pendingGstAmount > 0)
    .sort((a, b) => b.pendingGstAmount - a.pendingGstAmount);

  return {
    selectedMonth: month,
    invoiceRegisterRows,
    settlementRows,
    pendingInvoiceRows,
    openPurchaseOrderRows,
    poStatusRows,
    clientSummaryRows,
    gstPlanningRows,
    billedThisMonth,
    baseCashCollectedThisMonth,
    gstRecoveredThisMonth,
    gstPaidToGovernmentThisMonth,
    gstPendingFromClientsTotal,
    gstPayableOutstanding,
    netCashAfterGstOutflow: round2(baseCashCollectedThisMonth + gstRecoveredThisMonth - gstPaidToGovernmentThisMonth),
    openInvoicesAwaitingBaseClearance: finalInvoices.filter((invoice) => getBasePendingAmount(invoice) > 0.01).length,
    baseClearedGstPendingCount: finalInvoices.filter(
      (invoice) => getBasePendingAmount(invoice) <= 0.01 && getGstPendingFromClient(invoice) > 0.01,
    ).length,
    overdueBaseCount: finalInvoices.filter((invoice) => invoice.paymentStatus === "Overdue").length,
  };
}

export function exportDashboardWorkbook(month: string, snapshot: DashboardSnapshot) {
  const workbook = utils.book_new();
  const planningRow = snapshot.gstPlanningRows.find((row) => row.month === month);

  const summaryRows = [
    { Metric: "Month", Value: getMonthLabel(month) },
    { Metric: "Billed", Value: snapshot.billedThisMonth },
    { Metric: "Base collected", Value: snapshot.baseCashCollectedThisMonth },
    { Metric: "GST recovered from clients", Value: snapshot.gstRecoveredThisMonth },
    { Metric: "GST pending from clients", Value: snapshot.gstPendingFromClientsTotal },
    { Metric: "GST paid to government", Value: snapshot.gstPaidToGovernmentThisMonth },
    { Metric: "GST payable outstanding", Value: snapshot.gstPayableOutstanding },
    { Metric: "Net cash after GST", Value: snapshot.netCashAfterGstOutflow },
    { Metric: "Opening GST payable", Value: planningRow?.openingGstPayable ?? round2(Math.max(0, 0)) },
    { Metric: "Closing GST payable", Value: planningRow?.closingGstPayable ?? snapshot.gstPayableOutstanding },
    { Metric: "Open invoices awaiting base clearance", Value: snapshot.openInvoicesAwaitingBaseClearance },
    { Metric: "Base cleared but GST pending", Value: snapshot.baseClearedGstPendingCount },
  ];

  appendSheet(workbook, "Summary", summaryRows);
  appendSheet(workbook, "Invoice Register", snapshot.invoiceRegisterRows);
  appendSheet(workbook, "Settlement Register", snapshot.settlementRows);
  appendSheet(workbook, "GST Planning", snapshot.gstPlanningRows);
  appendSheet(workbook, "PO Status Tracker", snapshot.poStatusRows);
  appendSheet(workbook, "Client Summary", snapshot.clientSummaryRows);

  writeFileXLSX(workbook, `reconciliation-${month}.xlsx`);
}
