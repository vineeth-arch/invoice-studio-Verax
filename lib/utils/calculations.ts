import type { GSTMode, GSTSplit } from "@/lib/types/common";
import type { InvoiceLineItem, InvoiceTotals, RawInvoiceLineItem } from "@/lib/types/invoice";
import type { POLineItem, POTotals, RawPOLineItem } from "@/lib/types/purchase-order";
import { amountToWordsINR } from "./formatting";

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function splitGST(gstAmount: number, mode: GSTMode): GSTSplit {
  const g = r2(gstAmount);
  switch (mode) {
    case "CGST_SGST": {
      const half = r2(g / 2);
      return { cgst: half, sgst: r2(g - half), igst: 0 };
    }
    case "IGST":
      return { cgst: 0, sgst: 0, igst: g };
    case "NO_TAX":
    case "CUSTOM":
    default:
      return { cgst: 0, sgst: 0, igst: 0 };
  }
}

export function calculateLineItem(item: RawInvoiceLineItem, gstMode: GSTMode): InvoiceLineItem {
  const gross = r2(item.quantity * item.rate);
  const discountAmount = r2(gross * (item.discountPercent / 100));
  const taxableValue = r2(gross - discountAmount);
  const gstAmount = r2(taxableValue * (item.gstRate / 100));
  const { cgst, sgst, igst } = splitGST(gstAmount, gstMode);
  const lineTotal = r2(taxableValue + cgst + sgst + igst);
  return { ...item, gross, discountAmount, taxableValue, cgst, sgst, igst, lineTotal };
}

export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  cess: number,
  otherCharges: number
): InvoiceTotals {
  const subtotal = r2(items.reduce((s, i) => s + i.gross, 0));
  const totalDiscount = r2(items.reduce((s, i) => s + i.discountAmount, 0));
  const totalTaxableValue = r2(items.reduce((s, i) => s + i.taxableValue, 0));
  const totalCGST = r2(items.reduce((s, i) => s + i.cgst, 0));
  const totalSGST = r2(items.reduce((s, i) => s + i.sgst, 0));
  const totalIGST = r2(items.reduce((s, i) => s + i.igst, 0));
  const beforeRound = r2(totalTaxableValue + totalCGST + totalSGST + totalIGST + (cess || 0) + (otherCharges || 0));
  const roundOff = r2(Math.round(beforeRound) - beforeRound);
  const grandTotal = r2(beforeRound + roundOff);
  const amountInWords = amountToWordsINR(grandTotal);
  return {
    subtotal, totalDiscount, totalTaxableValue,
    totalCGST, totalSGST, totalIGST,
    cess: cess || 0, otherCharges: otherCharges || 0,
    roundOff, grandTotal, amountInWords,
  };
}

export function calculatePOLineItem(item: RawPOLineItem): POLineItem {
  const gross = r2(item.quantity * item.rate);
  const discountAmount = r2(gross * (item.discountPercent / 100));
  const taxableValue = r2(gross - discountAmount);
  const taxAmount = r2(taxableValue * (item.gstRate / 100));
  const lineTotal = r2(taxableValue + taxAmount);
  return { ...item, gross, discountAmount, taxableValue, taxAmount, lineTotal };
}

export function calculatePOTotals(items: POLineItem[], otherCharges: number): POTotals {
  const subtotal = r2(items.reduce((s, i) => s + i.gross, 0));
  const totalDiscount = r2(items.reduce((s, i) => s + i.discountAmount, 0));
  const totalTaxableValue = r2(items.reduce((s, i) => s + i.taxableValue, 0));
  const totalTax = r2(items.reduce((s, i) => s + i.taxAmount, 0));
  const beforeRound = r2(totalTaxableValue + totalTax + (otherCharges || 0));
  const roundOff = r2(Math.round(beforeRound) - beforeRound);
  const grandTotal = r2(beforeRound + roundOff);
  const amountInWords = amountToWordsINR(grandTotal);
  return {
    subtotal, totalDiscount, totalTaxableValue, totalTax,
    otherCharges: otherCharges || 0, roundOff, grandTotal, amountInWords,
  };
}
