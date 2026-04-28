"use client";

import { useState } from "react";
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormSetValue } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { GSTMode } from "@/lib/types/common";
import type { SavedService } from "@/lib/types/service";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";
import { GSTModeSelector } from "../GSTModeSelector";
import { calculateLineItem } from "@/lib/utils/calculations";
import { formatNumber } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/ui/Modal";
import { useServices } from "@/lib/hooks/useServices";

interface Props {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

const UNITS = ["PCS", "KG", "MTR", "LTR", "HRS", "DAYS", "BOX", "SET", "NOS", "SQM", "SQF", "RMT"];
const GST_OPTIONS = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
const inputClass = "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const metricClass = "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2";

function LineItemCard({
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Line Item {index + 1}</div>
          <div className="mt-1 text-sm text-slate-500">Edit the service details, pricing, and tax breakup inline.</div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-red-500"
          aria-label={`Remove line item ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2.4fr)_minmax(180px,1fr)]">
          <FormField label="Description" required>
            <input
              className={inputClass}
              placeholder="Item description"
              defaultValue={item?.description}
              onBlur={(e) => setValue(`lineItems.${index}.description`, e.target.value)}
            />
          </FormField>
          <FormField label="HSN / SAC" required>
            <input
              className={inputClass}
              placeholder="HSN/SAC code"
              defaultValue={item?.hsnSac}
              onBlur={(e) => setValue(`lineItems.${index}.hsnSac`, e.target.value)}
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
              defaultValue={item?.quantity}
              onBlur={(e) => setValue(`lineItems.${index}.quantity`, Number(e.target.value))}
            />
          </FormField>
          <FormField label="Unit">
            <select
              className={inputClass}
              defaultValue={item?.unit ?? "PCS"}
              onChange={(e) => setValue(`lineItems.${index}.unit`, e.target.value)}
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
              defaultValue={item?.rate}
              onBlur={(e) => setValue(`lineItems.${index}.rate`, Number(e.target.value))}
            />
          </FormField>
          <FormField label="Discount %">
            <input
              className={cn(inputClass, "text-right")}
              type="number"
              min="0"
              max="100"
              step="any"
              defaultValue={item?.discountPercent}
              onBlur={(e) => setValue(`lineItems.${index}.discountPercent`, Number(e.target.value))}
            />
          </FormField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FormField label="GST %">
            <select
              className={inputClass}
              defaultValue={item?.gstRate ?? 18}
              onChange={(e) => setValue(`lineItems.${index}.gstRate`, Number(e.target.value))}
            >
              {GST_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </FormField>

          <div className={metricClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Taxable Amount</div>
            <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.taxableValue ?? 0)}</div>
          </div>

          {gstMode === "CGST_SGST" ? (
            <>
              <div className={metricClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">CGST</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.cgst ?? 0)}</div>
              </div>
              <div className={metricClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">SGST</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.sgst ?? 0)}</div>
              </div>
            </>
          ) : gstMode === "IGST" ? (
            <div className={metricClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">IGST</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{formatNumber(calc?.igst ?? 0)}</div>
            </div>
          ) : (
            <div className={metricClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Tax</div>
              <div className="mt-1 text-base font-semibold text-slate-900">0.00</div>
            </div>
          )}

          <div className={cn(metricClass, "border-brand-100 bg-brand-50")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Total</div>
            <div className="mt-1 text-base font-bold text-brand-900">{formatNumber(calc?.lineTotal ?? 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineItemsSection({ control, setValue, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const gstMode = useWatch({ control, name: "gstMode" }) as GSTMode;
  const { services, loading } = useServices();
  const [catalogueOpen, setCatalogueOpen] = useState(false);

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
      <div className="mb-3">
        <div className="mb-1.5 text-xs text-slate-500">GST Mode</div>
        <GSTModeSelector value={gstMode} onChange={(mode) => setValue("gstMode", mode)} />
      </div>

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
            <LineItemCard
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              gstMode={gstMode}
              onRemove={() => remove(index)}
            />
          ))
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCatalogueOpen(true)}
          disabled={services.length === 0 || loading}
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
