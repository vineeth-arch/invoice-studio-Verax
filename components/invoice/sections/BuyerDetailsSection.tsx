"use client";

import { useMemo, useState } from "react";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { Button } from "@/components/ui/Button";
import { useSavedClients } from "@/lib/hooks/useSavedClients";
import type { SavedClient } from "@/lib/types/client";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  onSelectSavedClient: (client: SavedClient | null) => void;
  onSaveClient: () => void;
  savingClient?: boolean;
}

export function BuyerDetailsSection({
  control,
  register,
  errors,
  onSelectSavedClient,
  onSaveClient,
  savingClient,
}: Props) {
  const { clients, loading } = useSavedClients();
  const [selectedClientId, setSelectedClientId] = useState("");
  const hasClients = clients.length > 0;
  const placeholder = useMemo(() => {
    if (loading) return "Loading saved clients...";
    return hasClients ? "Select a saved client..." : "No saved clients — add one in Clients";
  }, [hasClients, loading]);

  return (
    <FormSection title="Buyer Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Select saved client" className="col-span-2">
          <select
            className={inputClass}
            value={selectedClientId}
            disabled={!hasClients || loading}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSelectedClientId(nextValue);
              if (!nextValue || nextValue === "__clear__") {
                onSelectSavedClient(null);
                return;
              }
              onSelectSavedClient(clients.find((client) => client.id === nextValue) ?? null);
            }}
          >
            <option value="">{placeholder}</option>
            {hasClients && <option value="__clear__">Clear selection</option>}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}{client.gstin ? ` • ${client.gstin}` : ""}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Buyer Name" required error={errors.buyer?.name?.message} className="col-span-2">
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

        <FormField label="State" required error={errors.buyer?.billingAddress?.state?.message}>
          <input type="text" className={inputClass} {...register("buyer.billingAddress.state")} />
        </FormField>

        <FormField label="State Code" required error={errors.buyer?.billingAddress?.stateCode?.message}>
          <input type="text" className={inputClass} placeholder="e.g. 27" maxLength={2} {...register("buyer.billingAddress.stateCode")} />
        </FormField>

        <FormField label="Pincode" required error={errors.buyer?.billingAddress?.pincode?.message}>
          <input type="text" className={inputClass} maxLength={6} {...register("buyer.billingAddress.pincode")} />
        </FormField>

        <FormField label="Buyer GSTIN (optional)" hint="Leave blank for unregistered buyers" className="col-span-2">
          <Controller name="buyer.gstin" control={control} render={({ field }) => (
            <GSTINInput value={field.value ?? ""} onChange={field.onChange} optional />
          )} />
        </FormField>

        <FormField label="Place of Supply" required error={errors.buyer?.placeOfSupply?.message}>
          <input type="text" className={inputClass} placeholder="State name" {...register("buyer.placeOfSupply")} />
        </FormField>

        <FormField label="Place of Supply Code" required error={errors.buyer?.placeOfSupplyCode?.message}>
          <input type="text" className={inputClass} placeholder="e.g. 27" maxLength={2} {...register("buyer.placeOfSupplyCode")} />
        </FormField>

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
