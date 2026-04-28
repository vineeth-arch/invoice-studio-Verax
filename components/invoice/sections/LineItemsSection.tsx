"use client";

import { useFieldArray, useWatch, type Control, type UseFormSetValue, type FieldErrors } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { GSTMode } from "@/lib/types/common";
import { FormSection } from "@/components/ui/FormSection";
import { GSTModeSelector } from "../GSTModeSelector";
import { calculateLineItem } from "@/lib/utils/calculations";
import { formatNumber } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface Props {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

const UNITS = ["PCS", "KG", "MTR", "LTR", "HRS", "DAYS", "BOX", "SET", "NOS", "SQM", "SQF", "RMT"];

function LineItemRow({
  index,
  control,
  setValue,
  gstMode,
  onRemove,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  gstMode: GSTMode;
  onRemove: () => void;
}) {
  const item = useWatch({ control, name: `lineItems.${index}` });

  const calc = item
    ? calculateLineItem(
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
    : null;

  const iCls = "block w-full border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400";
  const numCls = cn(iCls, "text-right");

  return (
    <tr className="border-b border-slate-100">
      <td className="px-1.5 py-1 text-center text-xs text-slate-400 w-6">{index + 1}</td>
      <td className="px-1 py-1">
        <input
          className={iCls}
          placeholder="Item description"
          defaultValue={item?.description}
          onBlur={(e) => setValue(`lineItems.${index}.description`, e.target.value)}
        />
        <input
          className={cn(iCls, "mt-1 text-[10px] text-slate-500")}
          placeholder="HSN/SAC code"
          defaultValue={item?.hsnSac}
          onBlur={(e) => setValue(`lineItems.${index}.hsnSac`, e.target.value)}
        />
      </td>
      <td className="px-1 py-1 w-16">
        <input
          className={numCls}
          type="number"
          min="0"
          step="any"
          defaultValue={item?.quantity}
          onBlur={(e) => setValue(`lineItems.${index}.quantity`, Number(e.target.value))}
        />
      </td>
      <td className="px-1 py-1 w-16">
        <select
          className={iCls}
          defaultValue={item?.unit ?? "PCS"}
          onChange={(e) => setValue(`lineItems.${index}.unit`, e.target.value)}
        >
          {UNITS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-1 py-1 w-20">
        <input
          className={numCls}
          type="number"
          min="0"
          step="any"
          defaultValue={item?.rate}
          onBlur={(e) => setValue(`lineItems.${index}.rate`, Number(e.target.value))}
        />
      </td>
      <td className="px-1 py-1 w-14">
        <input
          className={numCls}
          type="number"
          min="0"
          max="100"
          step="any"
          defaultValue={item?.discountPercent}
          onBlur={(e) => setValue(`lineItems.${index}.discountPercent`, Number(e.target.value))}
        />
      </td>
      <td className="px-1 py-1 w-16">
        <select
          className={iCls}
          defaultValue={item?.gstRate ?? 18}
          onChange={(e) => setValue(`lineItems.${index}.gstRate`, Number(e.target.value))}
        >
          {[0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28].map((r) => (
            <option key={r} value={r}>{r}%</option>
          ))}
        </select>
      </td>
      <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-20">{formatNumber(calc?.taxableValue ?? 0)}</td>
      {gstMode === "CGST_SGST" && (
        <>
          <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-16">{formatNumber(calc?.cgst ?? 0)}</td>
          <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-16">{formatNumber(calc?.sgst ?? 0)}</td>
        </>
      )}
      {gstMode === "IGST" && (
        <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-16">{formatNumber(calc?.igst ?? 0)}</td>
      )}
      <td className="px-1.5 py-1 text-right text-xs font-semibold text-slate-800 w-20">{formatNumber(calc?.lineTotal ?? 0)}</td>
      <td className="px-1 py-1 w-8">
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 p-0.5">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

export function LineItemsSection({ control, setValue, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const gstMode = useWatch({ control, name: "gstMode" }) as GSTMode;

  const addRow = () => {
    append({ id: uuidv4(), description: "", hsnSac: "", quantity: 1, unit: "PCS", rate: 0, discountPercent: 0, gstRate: 18 });
  };

  return (
    <FormSection title="Line Items">
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-1.5">GST Mode</div>
        <GSTModeSelector value={gstMode} onChange={(m) => setValue("gstMode", m)} />
      </div>

      {errors.lineItems?.root?.message && (
        <p className="text-xs text-red-600 mb-2" role="alert">{errors.lineItems.root.message}</p>
      )}

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="px-1.5 py-1.5 text-center w-6">#</th>
              <th className="px-1.5 py-1.5 text-left">Description / HSN</th>
              <th className="px-1.5 py-1.5 text-right w-16">Qty</th>
              <th className="px-1.5 py-1.5 text-center w-16">Unit</th>
              <th className="px-1.5 py-1.5 text-right w-20">Rate (₹)</th>
              <th className="px-1.5 py-1.5 text-right w-14">Disc%</th>
              <th className="px-1.5 py-1.5 text-right w-16">GST</th>
              <th className="px-1.5 py-1.5 text-right w-20">Taxable</th>
              {gstMode === "CGST_SGST" && <th className="px-1.5 py-1.5 text-right w-16">CGST</th>}
              {gstMode === "CGST_SGST" && <th className="px-1.5 py-1.5 text-right w-16">SGST</th>}
              {gstMode === "IGST" && <th className="px-1.5 py-1.5 text-right w-16">IGST</th>}
              <th className="px-1.5 py-1.5 text-right w-20">Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-6 text-slate-400 italic text-sm">
                  No line items yet. Add your first item or service to generate totals.
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <LineItemRow
                  key={field.id}
                  index={index}
                  control={control}
                  setValue={setValue}
                  gstMode={gstMode}
                  onRemove={() => remove(index)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2">
        <Plus className="h-3.5 w-3.5" />
        Add Item
      </Button>
    </FormSection>
  );
}
