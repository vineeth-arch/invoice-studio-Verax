"use client";

import { useEffect, useState } from "react";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";
import type { SavedClient } from "@/lib/types/client";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
  onSelectSavedClient: (client: SavedClient | null) => void;
}

export function POBuyerSection({ control, register, errors, onSelectSavedClient }: Props) {
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("di_clients");
      const parsed = raw ? JSON.parse(raw) : [];
      console.log("[PO BuyerSection] di_clients on mount:", parsed);
      setSavedClients(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("[PO BuyerSection] Failed to parse di_clients", error);
      setSavedClients([]);
    }
  }, []);

  const hasClients = savedClients.length > 0;

  return (
    <FormSection title="Buyer Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Select saved client" className="col-span-2">
          <select
            className={inputClass}
            value={selectedClientId}
            disabled={!hasClients}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSelectedClientId(nextValue);
              if (!nextValue || nextValue === "__clear__") {
                onSelectSavedClient(null);
                return;
              }
              onSelectSavedClient(savedClients.find((client) => client.id === nextValue) ?? null);
            }}
          >
            <option value="">
              {hasClients ? "Select a saved client..." : "No saved clients — add one in Clients"}
            </option>
            {hasClients && <option value="__clear__">Clear selection</option>}
            {savedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}{client.gstin ? ` • ${client.gstin}` : ""}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Company Name" required error={errors.buyer?.name?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("buyer.name")} />
        </FormField>
        <FormField label="Address Line 1" required error={errors.buyer?.address?.line1?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("buyer.address.line1")} />
        </FormField>
        <FormField label="Address Line 2">
          <input type="text" className={inputClass} {...register("buyer.address.line2")} />
        </FormField>
        <FormField label="City" required><input type="text" className={inputClass} {...register("buyer.address.city")} /></FormField>
        <FormField label="State" required><input type="text" className={inputClass} {...register("buyer.address.state")} /></FormField>
        <FormField label="State Code" required><input type="text" className={inputClass} maxLength={2} {...register("buyer.stateCode")} /></FormField>
        <FormField label="Pincode" required><input type="text" className={inputClass} maxLength={6} {...register("buyer.address.pincode")} /></FormField>
        <FormField label="GSTIN" required error={errors.buyer?.gstin?.message} className="col-span-2">
          <Controller name="buyer.gstin" control={control} render={({ field }) => (
            <GSTINInput value={field.value} onChange={field.onChange} />
          )} />
        </FormField>
        <FormField label="Email"><input type="email" className={inputClass} {...register("buyer.contact.email")} /></FormField>
        <FormField label="Phone"><input type="tel" className={inputClass} {...register("buyer.contact.phone")} /></FormField>
      </div>
      <FormField label="Logo">
        <Controller name="buyer.logoImageBase64" control={control} render={({ field }) => (
          <FileUpload value={field.value} onChange={field.onChange} label="Upload company logo" />
        )} />
      </FormField>
    </FormSection>
  );
}
