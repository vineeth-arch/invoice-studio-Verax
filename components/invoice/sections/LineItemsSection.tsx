"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormSetValue } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { X, GripVertical } from "lucide-react";
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

interface Props {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

const UNITS = ["PCS", "KG", "MTR", "LTR", "HRS", "DAYS", "BOX", "SET", "NOS", "SQM", "SQF", "RMT"];
const GST_OPTIONS = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

const inputClass =
  "block w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-[var(--accent-yellow)]";
const inputStyle = {
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
};
const metricStyle = {
  border: "1px solid var(--border)",
  background: "var(--surface-raised)",
  borderRadius: "12px",
  padding: "8px 12px",
};

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
    <div
      className="relative rounded-card p-4 animate-slide-in-down"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent-yellow)",
      }}
    >
      {/* Top bar: drag handle label + remove */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab" style={{ color: "var(--text-muted)" }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Line Item {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-accent-coral-muted"
          style={{ color: "var(--text-muted)" }}
          aria-label={`Remove line item ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3">
        {/* Row 1: Description + HSN */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,2.4fr)_minmax(180px,1fr)]">
          <FormField label="Description" required>
            <input
              className={inputClass}
              style={inputStyle}
              placeholder="Item or service description"
              defaultValue={item?.description}
              onBlur={(e) => setValue(`lineItems.${index}.description`, e.target.value)}
            />
          </FormField>
          <FormField label="HSN / SAC" required>
            <input
              className={cn(inputClass, "font-mono")}
              style={inputStyle}
              placeholder="Code"
              defaultValue={item?.hsnSac}
              onBlur={(e) => setValue(`lineItems.${index}.hsnSac`, e.target.value)}
            />
          </FormField>
        </div>

        {/* Row 2: Qty / Unit / Rate / Discount */}
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <FormField label="Qty">
            <input
              className={cn(inputClass, "text-right font-mono")}
              style={inputStyle}
              type="number" min="0" step="any"
              defaultValue={item?.quantity}
              onBlur={(e) => setValue(`lineItems.${index}.quantity`, Number(e.target.value))}
            />
          </FormField>
          <FormField label="Unit">
            <select
              className={inputClass}
              style={inputStyle}
              defaultValue={item?.unit ?? "PCS"}
              onChange={(e) => setValue(`lineItems.${index}.unit`, e.target.value)}
            >
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </FormField>
          <FormField label="Rate (₹)">
            <input
              className={cn(inputClass, "text-right font-mono")}
              style={inputStyle}
              type="number" min="0" step="any"
              defaultValue={item?.rate}
              onBlur={(e) => setValue(`lineItems.${index}.rate`, Number(e.target.value))}
            />
          </FormField>
          <FormField label="Discount %">
            <input
              className={cn(inputClass, "text-right font-mono")}
              style={inputStyle}
              type="number" min="0" max="100" step="any"
              defaultValue={item?.discountPercent}
              onBlur={(e) => setValue(`lineItems.${index}.discountPercent`, Number(e.target.value))}
            />
          </FormField>
        </div>

        {/* Row 3: GST + computed values (muted read-only style) */}
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-5">
          <FormField label="GST %">
            <select
              className={inputClass}
              style={inputStyle}
              defaultValue={item?.gstRate ?? 18}
              onChange={(e) => setValue(`lineItems.${index}.gstRate`, Number(e.target.value))}
            >
              {GST_OPTIONS.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </FormField>

          <div style={metricStyle}>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
              Taxable
            </div>
            <div className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatNumber(calc?.taxableValue ?? 0)}
            </div>
          </div>

          {gstMode === "CGST_SGST" ? (
            <>
              <div style={metricStyle}>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>CGST</div>
                <div className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(calc?.cgst ?? 0)}</div>
              </div>
              <div style={metricStyle}>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>SGST</div>
                <div className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(calc?.sgst ?? 0)}</div>
              </div>
            </>
          ) : gstMode === "IGST" ? (
            <div style={metricStyle} className="xl:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>IGST</div>
              <div className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(calc?.igst ?? 0)}</div>
            </div>
          ) : (
            <div style={metricStyle} className="xl:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Tax</div>
              <div className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>0.00</div>
            </div>
          )}

          {/* Total — yellow accent */}
          <div
            style={{
              background: "var(--accent-yellow-muted)",
              border: "1px solid var(--accent-yellow)",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent-yellow-text)" }}>
              Total
            </div>
            <div className="font-mono text-sm font-bold" style={{ color: "var(--accent-yellow-text)" }}>
              {formatNumber(calc?.lineTotal ?? 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineItemsSection({ control, setValue, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const gstMode = useWatch({ control, name: "gstMode" }) as GSTMode;
  const [services, setServices] = useState<SavedService[]>([]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("di_services");
      const parsed: SavedService[] = raw ? JSON.parse(raw) : [];
      console.log("[Invoice LineItemsSection] di_services on mount:", parsed);
      setServices(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error("[Invoice LineItemsSection] Failed to parse di_services", err);
    }
  }, []);

  const addRow = () => {
    append({
      id: uuidv4(),
      description: "",
      hsnSac: "",
      quantity: 1,
      unit: "PCS",
      rate: 0,
      discountPercent: 0,
      gstRate: 18,
    });
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
    <FormSection title="Line Items" accentColor="var(--accent-yellow)">
      <div className="mb-3">
        <div className="text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
          GST Mode
        </div>
        <GSTModeSelector value={gstMode} onChange={(mode) => setValue("gstMode", mode)} />
      </div>

      {errors.lineItems?.root?.message && (
        <p className="mb-2 text-xs" style={{ color: "var(--accent-coral)" }} role="alert">
          {errors.lineItems.root.message}
        </p>
      )}

      <div className="space-y-3">
        {fields.length === 0 ? (
          <div
            className="rounded-card px-6 py-10 text-center text-sm italic"
            style={{
              border: "1px dashed var(--border-strong)",
              background: "var(--surface-raised)",
              color: "var(--text-muted)",
            }}
          >
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

      {/* Add item button — dashed card style */}
      <button
        type="button"
        onClick={addRow}
        className="w-full mt-3 rounded-card py-4 text-sm font-medium transition-all duration-150 hover:border-solid"
        style={{
          border: "1px dashed var(--border-strong)",
          color: "var(--text-secondary)",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--accent-yellow-muted)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-yellow)";
          (e.currentTarget as HTMLElement).style.color = "var(--accent-yellow-text)";
          (e.currentTarget as HTMLElement).style.borderStyle = "solid";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLElement).style.borderStyle = "dashed";
        }}
      >
        ＋ Add line item
      </button>

      {/* Catalogue button */}
      <div className="mt-2 flex flex-wrap gap-2">
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
            <p style={{ color: "var(--text-secondary)" }}>No saved services yet.</p>
            <Link
              href="/services"
              className="text-sm font-medium"
              style={{ color: "var(--accent-yellow-text)" }}
            >
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
                className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-theme-surface-raised"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {service.description}
                </div>
                <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                  SAC {service.sacCode || "N/A"} · {service.unit} · ₹{service.defaultRate} · GST {service.defaultGstPercent}%
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </FormSection>
  );
}
