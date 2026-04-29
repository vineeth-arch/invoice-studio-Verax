"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

export function POVendorSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Buyer / Vendor Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Supplier Name" required error={errors.vendor?.name?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("vendor.name")} />
        </FormField>
        <FormField label="Address Line 1" required error={errors.vendor?.address?.line1?.message} className="col-span-2">
          <input type="text" className={inputClass} {...register("vendor.address.line1")} />
        </FormField>
        <FormField label="Address Line 2">
          <input type="text" className={inputClass} {...register("vendor.address.line2")} />
        </FormField>
        <FormField label="City" required><input type="text" className={inputClass} {...register("vendor.address.city")} /></FormField>
        <FormField label="State" required><input type="text" className={inputClass} {...register("vendor.address.state")} /></FormField>
        <FormField label="State Code"><input type="text" className={inputClass} maxLength={2} {...register("vendor.address.stateCode")} /></FormField>
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
