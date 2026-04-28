"use client";

import { useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { useMemo } from "react";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { GSTMode } from "@/lib/types/common";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { calculateLineItem, calculateInvoiceTotals } from "@/lib/utils/calculations";
import { formatCurrencyINR, formatNumber } from "@/lib/utils/formatting";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
}

export function TotalsSummarySection({ control, register }: Props) {
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];
  const gstMode = (useWatch({ control, name: "gstMode" }) ?? "CGST_SGST") as GSTMode;
  const cess = Number(useWatch({ control, name: "cess" })) || 0;
  const otherCharges = Number(useWatch({ control, name: "otherCharges" })) || 0;

  const totals = useMemo(() => {
    const calculated = lineItems.map((item) =>
      calculateLineItem(
        {
          id: item.id ?? "",
          description: item.description ?? "",
          hsnSac: item.hsnSac ?? "",
          quantity: Number(item.quantity) || 0,
          unit: item.unit ?? "PCS",
          rate: Number(item.rate) || 0,
          discountPercent: Number(item.discountPercent) || 0,
          gstRate: Number(item.gstRate) || 0,
        },
        gstMode
      )
    );
    return calculateInvoiceTotals(calculated, cess, otherCharges);
  }, [lineItems, gstMode, cess, otherCharges]);

  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const showTax = gstMode !== "NO_TAX";

  const rows: [string, number, string?][] = [
    ["Subtotal", totals.subtotal],
    ["(-) Total Discount", totals.totalDiscount],
    ["Taxable Value", totals.totalTaxableValue],
    ...(showTax && isCGST ? [["CGST", totals.totalCGST] as [string, number]] : []),
    ...(showTax && isCGST ? [["SGST/UTGST", totals.totalSGST] as [string, number]] : []),
    ...(showTax && isIGST ? [["IGST", totals.totalIGST] as [string, number]] : []),
    ...(cess > 0 ? [["Cess", totals.cess] as [string, number]] : []),
    ...(otherCharges > 0 ? [["Other Charges", totals.otherCharges] as [string, number]] : []),
    ...(totals.roundOff !== 0 ? [["Round Off", totals.roundOff] as [string, number]] : []),
  ];

  return (
    <FormSection title="Totals & Adjustments">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FormField label="Cess (optional)" hint="Additional cess amount">
          <input type="number" min="0" step="any" className={inputClass} {...register("cess")} />
        </FormField>
        <FormField label="Other Charges (optional)" hint="Freight, packaging, etc.">
          <input type="number" min="0" step="any" className={inputClass} {...register("otherCharges")} />
        </FormField>
      </div>

      <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-medium text-slate-800">{formatNumber(value)}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3 bg-slate-800 text-white">
          <span className="text-sm font-bold">Grand Total</span>
          <span className="text-sm font-bold">{formatCurrencyINR(totals.grandTotal)}</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500 italic">
        {totals.amountInWords}
      </div>
    </FormSection>
  );
}
