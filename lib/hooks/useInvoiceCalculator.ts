"use client";

import { useMemo } from "react";
import { formatCurrencyINR } from "@/lib/utils/formatting";

export interface CalcLineItem {
  quantity: number;
  rate: number;
  discountPercent?: number;
  gstRate?: number;
}

interface CalcResult {
  perRowSubtotal: number[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
  subtotalFmt: string;
  discountAmountFmt: string;
  gstAmountFmt: string;
  grandTotalFmt: string;
}

interface UseInvoiceCalculatorArgs {
  lineItems: CalcLineItem[];
  discountPct?: number;
  gstPct?: number;
}

export function useInvoiceCalculator({
  lineItems,
  discountPct = 0,
  gstPct = 18,
}: UseInvoiceCalculatorArgs): CalcResult {
  return useMemo(() => {
    const perRowSubtotal = lineItems.map((item) => {
      const gross = item.quantity * item.rate;
      const rowDiscount = gross * ((item.discountPercent ?? 0) / 100);
      return gross - rowDiscount;
    });

    const subtotal = perRowSubtotal.reduce((sum, v) => sum + v, 0);
    const discountAmount = subtotal * (discountPct / 100);
    const taxableAmount = subtotal - discountAmount;
    const effectiveGst = gstPct ?? lineItems.reduce((sum, item) => sum + (item.gstRate ?? 18), 0) / Math.max(lineItems.length, 1);
    const gstAmount = taxableAmount * (effectiveGst / 100);
    const grandTotal = taxableAmount + gstAmount;

    return {
      perRowSubtotal,
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      grandTotal,
      subtotalFmt: formatCurrencyINR(subtotal),
      discountAmountFmt: formatCurrencyINR(discountAmount),
      gstAmountFmt: formatCurrencyINR(gstAmount),
      grandTotalFmt: formatCurrencyINR(grandTotal),
    };
  }, [lineItems, discountPct, gstPct]);
}
