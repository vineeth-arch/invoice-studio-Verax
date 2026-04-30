import type { Invoice } from "@/lib/types/invoice";
import type { PaymentStatus } from "@/lib/types/common";

const EPSILON = 0.01;

function round2(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseAmount(value: number | undefined) {
  return round2(Number(value) || 0);
}

function laterDate(a?: string, b?: string) {
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
  return round2(Math.max((invoice.totals?.grandTotal ?? 0) - getInvoiceGstAmount(invoice) - (invoice.tdsAmount ?? 0), 0));
}

export function getBaseClearedAmount(invoice: Partial<Invoice>) {
  return parseAmount(invoice.baseClearedAmount ?? invoice.paymentReceivedAmount);
}

export function getGstClearedAmount(invoice: Partial<Invoice>) {
  if (!hasTaxOnInvoice(invoice)) return 0;
  return round2(clamp(parseAmount(invoice.gstClearedAmount), 0, getInvoiceGstAmount(invoice)));
}

export function getBasePendingAmount(invoice: Partial<Invoice>) {
  return round2(Math.max(getBaseExpectedAmount(invoice) - getBaseClearedAmount(invoice), 0));
}

export function getGstPendingAmount(invoice: Partial<Invoice>) {
  if (!hasTaxOnInvoice(invoice)) return 0;
  return round2(Math.max(getInvoiceGstAmount(invoice) - getGstClearedAmount(invoice), 0));
}

export function getTotalClearedAmount(invoice: Partial<Invoice>) {
  return round2(getBaseClearedAmount(invoice) + getGstClearedAmount(invoice));
}

export function isInvoiceFullyCleared(invoice: Partial<Invoice>) {
  return getBasePendingAmount(invoice) <= EPSILON && getGstPendingAmount(invoice) <= EPSILON;
}

export function getInvoiceClearedDate(invoice: Partial<Invoice>) {
  if (!isInvoiceFullyCleared(invoice)) return undefined;
  if (!hasTaxOnInvoice(invoice)) {
    return invoice.baseClearedDate ?? invoice.paymentReceivedDate;
  }
  return laterDate(invoice.baseClearedDate ?? invoice.paymentReceivedDate, invoice.gstClearedDate);
}

export function derivePaymentStatus(invoice: Partial<Invoice>): PaymentStatus {
  const baseCleared = getBaseClearedAmount(invoice);
  const gstCleared = getGstClearedAmount(invoice);
  if (isInvoiceFullyCleared(invoice) && (baseCleared > 0 || gstCleared > 0 || !hasTaxOnInvoice(invoice))) {
    return "Paid";
  }
  if (baseCleared > 0 || gstCleared > 0) {
    return "Partial";
  }
  return "Unpaid";
}

export function normalizeInvoiceSettlement<T extends Partial<Invoice>>(invoice: T): T {
  const taxable = hasTaxOnInvoice(invoice);
  const baseClearedAmount = getBaseClearedAmount(invoice);
  const gstClearedAmount = taxable ? getGstClearedAmount(invoice) : 0;
  const baseClearedDate = invoice.baseClearedDate ?? invoice.paymentReceivedDate;
  const normalized: Partial<Invoice> = {
    ...invoice,
    baseClearedAmount,
    baseClearedDate,
    gstCollectionMode: taxable ? (invoice.gstCollectionMode ?? "standard") : "standard",
    gstClearedAmount,
    gstCleared: taxable ? gstClearedAmount >= getInvoiceGstAmount(invoice) - EPSILON : true,
    gstClearedDate: taxable ? invoice.gstClearedDate : undefined,
    paymentReceivedAmount: baseClearedAmount,
    paymentReceivedDate: baseClearedDate,
    netReceived: round2(baseClearedAmount + (invoice.tdsDeducted ?? 0)),
  };

  normalized.invoiceClearedDate = getInvoiceClearedDate(normalized);
  normalized.paymentStatus = derivePaymentStatus(normalized);

  return normalized as T;
}
