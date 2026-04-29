"use client";

import { useEffect, useState } from "react";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { getCodeByState, getStateByCode } from "@/lib/data/states";
import type { SavedClient } from "@/lib/types/client";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  watch: UseFormWatch<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  errors: FieldErrors<POFormValues>;
  onSelectSavedClient: (client: SavedClient | null) => void;
}

export function POVendorSection({ control, register, watch, setValue, errors, onSelectSavedClient }: Props) {
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("di_clients");
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedClients(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedClients([]);
    }
  }, []);
  const hasClients = savedClients.length > 0;

  return (
    <FormSection title="Buyer / Vendor Details (BILL TO)">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Select saved client for BILL TO" className="col-span-2">
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
        <FormField label="Name" required error={errors.vendor?.name?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("vendor.name")} />
        </FormField>
        <FormField label="Address Line 1" required error={errors.vendor?.address?.line1?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("vendor.address.line1")} />
        </FormField>
        <FormField label="Address Line 2">
          <input type="text" className={inputClass} {...register("vendor.address.line2")} />
        </FormField>
        <FormField label="City" required><input type="text" className={inputClass} {...register("vendor.address.city")} /></FormField>
        <StateCodeInput
          stateValue={watch("vendor.address.state") ?? ""}
          stateCodeValue={watch("vendor.address.stateCode") ?? ""}
          onStateChange={(value) => {
            setValue("vendor.address.state", value);
            const code = getCodeByState(value);
            if (code) setValue("vendor.address.stateCode", code);
          }}
          onStateCodeChange={(value) => {
            setValue("vendor.address.stateCode", value);
            const name = getStateByCode(value);
            if (name) setValue("vendor.address.state", name);
          }}
          stateError={errors.vendor?.address?.state?.message}
          stateCodeError={errors.vendor?.address?.stateCode?.message}
          required
        />
        <FormField label="Pincode"><input type="text" className={inputClass} maxLength={6} {...register("vendor.address.pincode")} /></FormField>
        <FormField label="GSTIN (optional)" className="col-span-2">
          <Controller name="vendor.gstin" control={control} render={({ field }) => (
            <GSTINInput value={field.value ?? ""} onChange={field.onChange} optional />
          )} />
        </FormField>
        <FormField label="Contact Person"><input type="text" className={inputClass} {...register("vendor.contactPerson")} /></FormField>
        <FormField label="Email"><input type="email" className={inputClass} {...register("vendor.contact.email")} /></FormField>
        <FormField label="Phone"><input type="tel" className={inputClass} {...register("vendor.contact.phone")} /></FormField>
      </div>
    </FormSection>
  );
}
