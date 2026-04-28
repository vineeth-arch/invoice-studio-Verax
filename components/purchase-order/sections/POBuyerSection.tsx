"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

export function POBuyerSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Buyer Details">
      <div className="grid grid-cols-2 gap-3">
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
