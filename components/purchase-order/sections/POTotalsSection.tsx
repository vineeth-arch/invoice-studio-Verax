"use client";

import { useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { useMemo } from "react";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { calculatePOLineItem, calculatePOTotals } from "@/lib/utils/calculations";
import { formatCurrencyINR, formatNumber } from "@/lib/utils/formatting";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
}

export function POTotalsSection({ control, register }: Props) {
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];
  const otherCharges = Number(useWatch({ control, name: "otherCharges" })) || 0;

  const totals = useMemo(() => {
    const items = lineItems.map((item) =>
      calculatePOLineItem({
        id: item.id ?? "",
        description: item.description ?? "",
        hsnSac: item.hsnSac ?? "",
        quantity: Number(item.quantity) || 0,
        unit: item.unit ?? "PCS",
        rate: Number(item.rate) || 0,
        discountPercent: Number(item.discountPercent) || 0,
        gstRate: Number(item.gstRate) || 0,
      })
    );
    return calculatePOTotals(items, otherCharges);
  }, [lineItems, otherCharges]);

  const rows: [string, number][] = [
    ["Subtotal", totals.subtotal],
    ["(-) Total Discount", totals.totalDiscount],
    ["Taxable Value", totals.totalTaxableValue],
    ["GST / Tax", totals.totalTax],
    ...(otherCharges > 0 ? [["Other Charges", totals.otherCharges] as [string, number]] : []),
    ...(totals.roundOff !== 0 ? [["Round Off", totals.roundOff] as [string, number]] : []),
  ];

  return (
    <FormSection title="Totals & Adjustments">
      <FormField label="Other Charges (optional)" hint="Freight, packaging, etc.">
        <input type="number" min="0" step="any" className={inputClass} {...register("otherCharges")} />
      </FormField>

      <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200 mt-3">
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

      <div className="mt-2 text-xs text-slate-500 italic">{totals.amountInWords}</div>
    </FormSection>
  );
}
