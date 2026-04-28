"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

export function SupplierDetailsSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Supplier Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Supplier Name" required error={errors.supplier?.name?.message} className="col-span-2">
          <input type="text" className={inputClass} placeholder="Your business name" {...register("supplier.name")} />
        </FormField>

        <FormField label="Address Line 1" required error={errors.supplier?.address?.line1?.message} className="col-span-2">
          <input type="text" className={inputClass} placeholder="Street, Building" {...register("supplier.address.line1")} />
        </FormField>

        <FormField label="Address Line 2">
          <input type="text" className={inputClass} placeholder="Area, Landmark (optional)" {...register("supplier.address.line2")} />
        </FormField>

        <FormField label="City" required error={errors.supplier?.address?.city?.message}>
          <input type="text" className={inputClass} {...register("supplier.address.city")} />
        </FormField>

        <FormField label="State" required error={errors.supplier?.address?.state?.message}>
          <input type="text" className={inputClass} {...register("supplier.address.state")} />
        </FormField>

        <FormField label="State Code" required error={errors.supplier?.stateCode?.message}>
          <input type="text" className={inputClass} placeholder="e.g. 27" maxLength={2} {...register("supplier.stateCode")} />
        </FormField>

        <FormField label="Pincode" required error={errors.supplier?.address?.pincode?.message}>
          <input type="text" className={inputClass} maxLength={6} {...register("supplier.address.pincode")} />
        </FormField>

        <FormField label="GSTIN" required error={errors.supplier?.gstin?.message} className="col-span-2">
          <Controller name="supplier.gstin" control={control} render={({ field }) => (
            <GSTINInput value={field.value} onChange={field.onChange} />
          )} />
        </FormField>

        <FormField label="PAN (optional)">
          <input type="text" className={inputClass} placeholder="AAAAA0000A" maxLength={10} {...register("supplier.pan")} />
        </FormField>

        <FormField label="Email">
          <input type="email" className={inputClass} {...register("supplier.contact.email")} />
        </FormField>

        <FormField label="Phone">
          <input type="tel" className={inputClass} {...register("supplier.contact.phone")} />
        </FormField>

        <FormField label="Website">
          <input type="text" className={inputClass} placeholder="https://..." {...register("supplier.contact.website")} />
        </FormField>
      </div>

      <FormField label="Logo">
        <Controller name="supplier.logoImageBase64" control={control} render={({ field }) => (
          <FileUpload value={field.value} onChange={field.onChange} label="Upload company logo" />
        )} />
      </FormField>
    </FormSection>
  );
}
