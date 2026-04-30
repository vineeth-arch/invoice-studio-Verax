import type { CollectionState, PaymentStatus } from "@/lib/types/common";
import type { Invoice } from "@/lib/types/invoice";

const EPSILON = 0.01;

type LegacyInvoiceSettlement = Partial<Invoice> & {
  gstClearedAmount?: number;
  gstClearedDate?: string;
  gstCleared?: boolean;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseAmount(value: number | undefined) {
  return round2(Number(value) || 0);
}

export function laterDate(a?: string, b?: string) {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function getInvoiceGstAmount(invoice: Partial<Invoice>) {
  return round2(
    (invoice.totals?.totalCGST ?? 0) +
    (invoice.totals?.totalSGST ?? 0) +
    (invoice.totals?.totalIGST ?? 0)
  );
}

export function hasTaxOnInvoice(invoice: Partial<Invoice>) {
  return invoice.gstMode !== "NO_TAX" && getInvoiceGstAmount(invoice) > 0;
}

export function getBaseExpectedAmount(invoice: Partial<Invoice>) {
  return round2(
    Math.max((invoice.totals?.grandTotal ?? 0) - getInvoiceGstAmount(invoice) - (invoice.tdsAmount ?? 0), 0)
  );
}

export function getBaseClearedAmount(invoice: Partial<Invoice>) {
  return parseAmount(invoice.baseClearedAmount ?? invoice.paymentReceivedAmount);
}

export function getGstRecoveredAmount(invoice: LegacyInvoiceSettlement) {
  if (!hasTaxOnInvoice(invoice)) return 0;
  const rawAmount = invoice.gstRecoveredAmount ?? invoice.gstClearedAmount;
  return round2(clamp(parseAmount(rawAmount), 0, getInvoiceGstAmount(invoice)));
}

export function getBasePendingAmount(invoice: Partial<Invoice>) {
  return round2(Math.max(getBaseExpectedAmount(invoice) - getBaseClearedAmount(invoice), 0));
}

export function getGstPendingFromClient(invoice: LegacyInvoiceSettlement) {
  if (!hasTaxOnInvoice(invoice)) return 0;
  return round2(Math.max(getInvoiceGstAmount(invoice) - getGstRecoveredAmount(invoice), 0));
}

export const getGstPendingAmount = getGstPendingFromClient;

export function isBaseCleared(invoice: Partial<Invoice>) {
  return getBasePendingAmount(invoice) <= EPSILON;
}

export function isFullyRecoveredFromClient(invoice: LegacyInvoiceSettlement) {
  return isBaseCleared(invoice) && getGstPendingFromClient(invoice) <= EPSILON;
}

export function getInvoiceClearedDate(invoice: Partial<Invoice>) {
  return isBaseCleared(invoice) ? (invoice.baseClearedDate ?? invoice.paymentReceivedDate) : undefined;
}

export function derivePaymentStatus(invoice: LegacyInvoiceSettlement): PaymentStatus {
  const baseClearedAmount = getBaseClearedAmount(invoice);
  if (isBaseCleared(invoice) && (baseClearedAmount > 0 || getBaseExpectedAmount(invoice) <= EPSILON)) {
    return "Paid";
  }
  if (baseClearedAmount > 0 || getGstRecoveredAmount(invoice) > 0) {
    return "Partial";
  }
  return "Unpaid";
}

export function deriveCollectionState(invoice: LegacyInvoiceSettlement): CollectionState {
  const baseCleared = isBaseCleared(invoice);
  const gstPending = getGstPendingFromClient(invoice);
  const baseClearedAmount = getBaseClearedAmount(invoice);
  const gstRecoveredAmount = getGstRecoveredAmount(invoice);

  if (baseCleared && gstPending <= EPSILON) {
    return "Fully Recovered From Client";
  }
  if (baseCleared) {
    return "Base Cleared / GST Pending";
  }
  if (baseClearedAmount > 0 || gstRecoveredAmount > 0) {
    return "Partially Recovered";
  }
  return "Unpaid";
}

export function normalizeInvoiceSettlement<T extends LegacyInvoiceSettlement>(invoice: T): T {
  const taxable = hasTaxOnInvoice(invoice);
  const baseClearedAmount = getBaseClearedAmount(invoice);
  const gstRecoveredAmount = taxable ? getGstRecoveredAmount(invoice) : 0;
  const baseClearedDate = invoice.baseClearedDate ?? invoice.paymentReceivedDate;
  const gstRecoveredDate = taxable ? (invoice.gstRecoveredDate ?? invoice.gstClearedDate) : undefined;

  const normalized: LegacyInvoiceSettlement = {
    ...invoice,
    baseClearedAmount,
    baseClearedDate,
    gstCollectionMode: taxable ? (invoice.gstCollectionMode ?? "standard") : "standard",
    gstRecoveredAmount,
    gstRecoveredDate,
    paymentReceivedAmount: baseClearedAmount,
    paymentReceivedDate: baseClearedDate,
    netReceived: round2(baseClearedAmount + gstRecoveredAmount + (invoice.tdsDeducted ?? 0)),
    gstClearedAmount: gstRecoveredAmount,
    gstClearedDate: gstRecoveredDate,
    gstCleared: taxable ? gstRecoveredAmount >= getInvoiceGstAmount(invoice) - EPSILON : true,
  };

  normalized.invoiceClearedDate = getInvoiceClearedDate(normalized);
  normalized.paymentStatus = derivePaymentStatus(normalized);
  normalized.collectionState = deriveCollectionState(normalized);

  return normalized as T;
}
