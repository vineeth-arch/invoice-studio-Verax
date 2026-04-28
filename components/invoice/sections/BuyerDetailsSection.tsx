"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

export function BuyerDetailsSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Buyer Details">
      <div className="grid grid-cols-2 gap-3">
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
    </FormSection>
  );
}
