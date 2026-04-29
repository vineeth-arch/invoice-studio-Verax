"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormSetValue } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { GripVertical, Plus, X } from "lucide-react";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import type { SavedService } from "@/lib/types/service";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { calculatePOLineItem } from "@/lib/utils/calculations";
import { formatNumber } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/ui/Modal";
import { SACSearchInput } from "@/components/ui/SACSearchInput";

interface Props {
  control: Control<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

const UNITS = ["PCS", "KG", "MTR", "LTR", "HRS", "DAYS", "BOX", "SET", "NOS", "SQM", "SQF", "RMT"];
const GST_OPTIONS = [0, 1, 2, 5, 12, 18, 28];
const metricClass = "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2";

function POLineItemCard({
  index,
  control,
  setValue,
  onRemove,
}: {
  index: number;
  control: Control<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  onRemove: () => void;
}) {
  const item = useWatch({ control, name: `lineItems.${index}` });

  const calc = item
    ? calculatePOLineItem({
        id: item.id ?? "",
        description: item.description ?? "",
        hsnSac: item.hsnSac ?? "",
        quantity: Number(item.quantity) || 0,
        unit: item.unit ?? "PCS",
        rate: Number(item.rate) || 0,
        discountPercent: Number(item.discountPercent) || 0,
        gstRate: Number(item.gstRate) || 0,
      })
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: "3px solid #2828b0" }}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <GripVertical className="h-4 w-4 text-slate-400" />
          <span>Item #{index + 1}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label={`Remove line item ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2.4fr)_minmax(180px,1fr)]">
          <FormField label="Description" required>
            <input
              className={inputClass}
              placeholder="Item description"
              value={item?.description ?? ""}
              onChange={(event) => setValue(`lineItems.${index}.description`, event.target.value, { shouldDirty: true })}
            />
          </FormField>
          <FormField label="HSN / SAC">
            <SACSearchInput
              value={item?.hsnSac ?? ""}
              onChange={(value) => setValue(`lineItems.${index}.hsnSac`, value, { shouldDirty: true })}
              onSelect={(sac) => {
                setValue(`lineItems.${index}.hsnSac`, sac.code, { shouldDirty: true });
                setValue(`lineItems.${index}.gstRate`, sac.defaultGstRate, { shouldDirty: true });
              }}
            />
          </FormField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FormField label="Qty">
            <input
              className={cn(inputClass, "text-right")}
              type="number"
              min="0"
              step="any"
              value={item?.quantity ?? ""}
              onChange={(event) => setValue(`lineItems.${index}.quantity`, Number(event.target.value), { shouldDirty: true })}
            />
          </FormField>
          <FormField label="Unit">
            <select
              className={inputClass}
              value={item?.unit ?? "PCS"}
              onChange={(event) => setValue(`lineItems.${index}.unit`, event.target.value, { shouldDirty: true })}
            >
              {UNITS.map((unit) => <option key={unit}>{unit}</option>)}
            </select>
          </FormField>
          <FormField label="Rate (₹)">
            <input
              className={cn(inputClass, "text-right")}
              type="number"
              min="0"
              step="any"
              value={item?.rate ?? ""}
              onChange={(event) => setValue(`lineItems.${index}.rate`, Number(event.target.value), { shouldDirty: true })}
            />
          </FormField>
          <FormField label="Disc %">
            <input
              className={cn(inputClass, "text-right")}
              type="number"
              min="0"
              max="100"
              step="any"
              value={item?.discountPercent ?? ""}
              onChange={(event) => setValue(`lineItems.${index}.discountPercent`, Number(event.target.value), { shouldDirty: true })}
            />
          </FormField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FormField label="GST %">
            <select
              className={inputClass}
              value={item?.gstRate ?? 18}
              onChange={(event) => setValue(`lineItems.${index}.gstRate`, Number(event.target.value), { shouldDirty: true })}
            >
              {GST_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </FormField>
          <div className={metricClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Taxable Amt</div>
            <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.taxableValue ?? 0)}</div>
          </div>
          <div className={metricClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Tax Amt</div>
            <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.taxAmount ?? 0)}</div>
          </div>
          <div className={cn(metricClass, "border-brand-100 bg-brand-50")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Total</div>
            <div className="mt-1 text-base font-bold text-brand-900">{formatNumber(calc?.lineTotal ?? 0)}</div>
          </div>
        </div>
      </div>
    </div>
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
      setServices(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("[PO LineItemsSection] Failed to parse di_services", error);
      setServices([]);
    }
  }, []);

  const addRow = () => {
    append({ id: uuidv4(), description: "", hsnSac: "", quantity: 1, unit: "PCS", rate: 0, discountPercent: 0, gstRate: 18 });
  };

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
        <p className="mb-2 text-xs text-red-600" role="alert">{errors.lineItems.root.message}</p>
      )}

      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm italic text-slate-400">
            No line items yet. Add your first item or service to generate totals.
          </div>
        ) : (
          fields.map((field, index) => (
            <POLineItemCard
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              onRemove={() => remove(index)}
            />
          ))
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={addRow}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add line item
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCatalogueOpen(true)}
          disabled={services.length === 0}
          title={services.length === 0 ? "No saved services — add one in Services" : "Add a saved service"}
        >
          Add from catalogue
        </Button>
      </div>

      <Modal open={catalogueOpen} onClose={() => setCatalogueOpen(false)} title="Service catalogue">
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
