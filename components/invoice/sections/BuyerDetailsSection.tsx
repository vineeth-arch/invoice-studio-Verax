"use client";

import { useEffect, useState } from "react";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { Button } from "@/components/ui/Button";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { getCodeByState, getStateByCode } from "@/lib/data/states";
import type { SavedClient } from "@/lib/types/client";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  isProforma: boolean;
  onSelectSavedClient: (client: SavedClient | null) => void;
  onSaveClient: () => void;
  savingClient?: boolean;
}

export function BuyerDetailsSection({
  control,
  register,
  watch,
  setValue,
  errors,
  isProforma,
  onSelectSavedClient,
  onSaveClient,
  savingClient,
}: Props) {
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("di_clients");
      const parsed = raw ? JSON.parse(raw) : [];
      console.log("[Invoice BuyerDetailsSection] di_clients on mount:", parsed);
      setSavedClients(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("[Invoice BuyerDetailsSection] Failed to parse di_clients", error);
      setSavedClients([]);
    }
  }, []);

  const hasClients = savedClients.length > 0;

  return (
    <FormSection title="Buyer Details (BILL TO)">
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

        <FormField label="Name" required error={errors.buyer?.name?.message} className="col-span-2">
          <input type="text" className={inputClass} placeholder="Client / customer name" {...register("buyer.name")} />
        </FormField>

        <FormField label="Billing Address Line 1" required error={errors.buyer?.billingAddress?.line1?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("buyer.billingAddress.line1")} />
        </FormField>

        <FormField label="Address Line 2">
          <input type="text" className={inputClass} {...register("buyer.billingAddress.line2")} />
        </FormField>

        <FormField label="City" required error={errors.buyer?.billingAddress?.city?.message}>
          <input type="text" className={inputClass} {...register("buyer.billingAddress.city")} />
        </FormField>

        <StateCodeInput
          stateValue={watch("buyer.billingAddress.state") ?? ""}
          stateCodeValue={watch("buyer.billingAddress.stateCode") ?? ""}
          onStateChange={(value) => {
            setValue("buyer.billingAddress.state", value);
            const code = getCodeByState(value);
            if (code) setValue("buyer.billingAddress.stateCode", code);
          }}
          onStateCodeChange={(value) => {
            setValue("buyer.billingAddress.stateCode", value);
            const name = getStateByCode(value);
            if (name) setValue("buyer.billingAddress.state", name);
          }}
          stateError={errors.buyer?.billingAddress?.state?.message}
          stateCodeError={errors.buyer?.billingAddress?.stateCode?.message}
          required
        />

        <FormField label="Pincode" required error={errors.buyer?.billingAddress?.pincode?.message}>
          <input type="text" className={inputClass} maxLength={6} {...register("buyer.billingAddress.pincode")} />
        </FormField>

        {!isProforma && (
          <FormField label="Buyer GSTIN (optional)" hint="Leave blank for unregistered buyers" className="col-span-2">
            <Controller name="buyer.gstin" control={control} render={({ field }) => (
              <GSTINInput value={field.value ?? ""} onChange={field.onChange} optional />
            )} />
          </FormField>
        )}

        <StateCodeInput
          stateValue={watch("buyer.placeOfSupply") ?? ""}
          stateCodeValue={watch("buyer.placeOfSupplyCode") ?? ""}
          onStateChange={(value) => {
            setValue("buyer.placeOfSupply", value);
            const code = getCodeByState(value);
            if (code) setValue("buyer.placeOfSupplyCode", code);
          }}
          onStateCodeChange={(value) => {
            setValue("buyer.placeOfSupplyCode", value);
            const name = getStateByCode(value);
            if (name) setValue("buyer.placeOfSupply", name);
          }}
          stateError={errors.buyer?.placeOfSupply?.message}
          stateCodeError={errors.buyer?.placeOfSupplyCode?.message}
          stateLabel="Place of Supply"
          stateCodeLabel="Place of Supply Code"
          required
        />

        <FormField label="Buyer Email">
          <input type="email" className={inputClass} {...register("buyer.contact.email")} />
        </FormField>

        <FormField label="Buyer Phone">
          <input type="tel" className={inputClass} {...register("buyer.contact.phone")} />
        </FormField>
      </div>

      <div className="mt-3">
        <Button type="button" variant="outline" size="sm" onClick={onSaveClient} loading={savingClient}>
          Save this client
        </Button>
      </div>
    </FormSection>
  );
}
