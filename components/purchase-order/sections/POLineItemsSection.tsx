"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useWatch, type Control, type UseFormSetValue, type FieldErrors } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2 } from "lucide-react";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import type { SavedService } from "@/lib/types/service";
import { FormSection } from "@/components/ui/FormSection";
import { calculatePOLineItem } from "@/lib/utils/calculations";
import { formatNumber } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

interface Props {
  control: Control<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

const UNITS = ["PCS", "KG", "MTR", "LTR", "HRS", "DAYS", "BOX", "SET", "NOS", "SQM", "SQF", "RMT"];

function POLineItemRow({ index, control, setValue, onRemove }: {
  index: number;
  control: Control<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  onRemove: () => void;
}) {
  const item = useWatch({ control, name: `lineItems.${index}` });

  const calc = item ? calculatePOLineItem({
    id: item.id ?? "",
    description: item.description ?? "",
    hsnSac: item.hsnSac ?? "",
    quantity: Number(item.quantity) || 0,
    unit: item.unit ?? "PCS",
    rate: Number(item.rate) || 0,
    discountPercent: Number(item.discountPercent) || 0,
    gstRate: Number(item.gstRate) || 0,
  }) : null;

  const iCls = "block w-full border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-brand-400";
  const numCls = cn(iCls, "text-right");

  return (
    <tr className="border-b border-slate-100">
      <td className="px-1.5 py-1 text-center text-xs text-slate-400 w-6">{index + 1}</td>
      <td className="px-1 py-1">
        <input className={iCls} placeholder="Description" defaultValue={item?.description}
          onBlur={(e) => setValue(`lineItems.${index}.description`, e.target.value)} />
        <input className={cn(iCls, "mt-1 text-[10px]")} placeholder="HSN/SAC"
          defaultValue={item?.hsnSac} onBlur={(e) => setValue(`lineItems.${index}.hsnSac`, e.target.value ?? "")} />
      </td>
      <td className="px-1 py-1 w-16">
        <input className={numCls} type="number" min="0" step="any" defaultValue={item?.quantity}
          onBlur={(e) => setValue(`lineItems.${index}.quantity`, Number(e.target.value))} />
      </td>
      <td className="px-1 py-1 w-16">
        <select className={iCls} defaultValue={item?.unit ?? "PCS"}
          onChange={(e) => setValue(`lineItems.${index}.unit`, e.target.value)}>
          {UNITS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-1 py-1 w-20">
        <input className={numCls} type="number" min="0" step="any" defaultValue={item?.rate}
          onBlur={(e) => setValue(`lineItems.${index}.rate`, Number(e.target.value))} />
      </td>
      <td className="px-1 py-1 w-14">
        <input className={numCls} type="number" min="0" max="100" defaultValue={item?.discountPercent}
          onBlur={(e) => setValue(`lineItems.${index}.discountPercent`, Number(e.target.value))} />
      </td>
      <td className="px-1 py-1 w-14">
        <select className={iCls} defaultValue={item?.gstRate ?? 18}
          onChange={(e) => setValue(`lineItems.${index}.gstRate`, Number(e.target.value))}>
          {[0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28].map((r) => (
            <option key={r} value={r}>{r}%</option>
          ))}
        </select>
      </td>
      <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-20">{formatNumber(calc?.taxableValue ?? 0)}</td>
      <td className="px-1.5 py-1 text-right text-xs text-slate-600 w-16">{formatNumber(calc?.taxAmount ?? 0)}</td>
      <td className="px-1.5 py-1 text-right text-xs font-semibold text-slate-800 w-20">{formatNumber(calc?.lineTotal ?? 0)}</td>
      <td className="px-1 py-1 w-8">
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 p-0.5">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

export function POLineItemsSection({ control, setValue, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const [services, setServices] = useState<SavedService[]>([]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("di_services");
      const parsed = raw ? JSON.parse(raw) : [];
      console.log("[PO LineItemsSection] di_services on mount:", parsed);
      setServices(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("[PO LineItemsSection] Failed to parse di_services", error);
      setServices([]);
    }
  }, []);

  const addService = (service: SavedService) => {
    append({
      id: uuidv4(),
      description: service.description,
      hsnSac: service.sacCode,
      quantity: 1,
      unit: service.unit || "PCS",
      rate: service.defaultRate,
      discountPercent: 0,
      gstRate: service.defaultGstPercent,
    });
    setCatalogueOpen(false);
  };

  return (
    <FormSection title="Line Items">
      {errors.lineItems?.root?.message && (
        <p className="text-xs text-red-600 mb-2">{errors.lineItems.root.message}</p>
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
              <th className="px-1.5 py-1.5 text-right w-14">GST%</th>
              <th className="px-1.5 py-1.5 text-right w-20">Taxable</th>
              <th className="px-1.5 py-1.5 text-right w-16">Tax Amt</th>
              <th className="px-1.5 py-1.5 text-right w-20">Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6 text-slate-400 italic text-sm">
                  No line items yet. Add your first item or service to generate totals.
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <POLineItemRow key={field.id} index={index} control={control} setValue={setValue} onRemove={() => remove(index)} />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() =>
          append({ id: uuidv4(), description: "", hsnSac: "", quantity: 1, unit: "PCS", rate: 0, discountPercent: 0, gstRate: 18 })
        }>
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCatalogueOpen(true)}
          disabled={services.length === 0}
          title={services.length === 0 ? "No saved services — add one in Services" : "Add a saved service"}
        >
          Add from catalogue
        </Button>
      </div>

      <Modal
        open={catalogueOpen}
        onClose={() => setCatalogueOpen(false)}
        title="Service catalogue"
      >
        {services.length === 0 ? (
          <div className="space-y-3">
            <p>No saved services yet.</p>
            <Link href="/services" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Open Services page
            </Link>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => addService(service)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="text-sm font-medium text-slate-900">{service.description}</div>
                <div className="text-xs text-slate-500">
                  SAC {service.sacCode || "N/A"} • {service.unit} • ₹{service.defaultRate} • GST {service.defaultGstPercent}%
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </FormSection>
  );
}
