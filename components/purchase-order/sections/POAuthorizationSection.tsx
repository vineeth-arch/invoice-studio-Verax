"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, selectClass, selectStyle } from "@/components/ui/FormField";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

export function POAuthorizationSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Authorization" defaultOpen={false}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <FormField label="Prepared By">
          <input type="text" className={inputClass} {...register("preparedBy")} />
        </FormField>
        <FormField label="Approved By" required error={errors.approvedBy?.message}>
          <input type="text" className={inputClass} {...register("approvedBy")} />
        </FormField>
        <FormField
          label="PO Status"
          hint="Set to Approved after internal review so invoice conversion becomes available."
        >
          <select
            className={selectClass}
            style={selectStyle}
            {...register("poStatus")}
          >
            <option value="Under Approval">Under Approval</option>
            <option value="Approved">Approved</option>
            <option value="Processed">Processed</option>
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <FormField label="Prepared By Signature">
          <Controller name="preparedBySignature.signatureImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload signature" />
          )} />
        </FormField>
        <FormField label="Authorized Signature">
          <Controller name="approvedBySignature.signatureImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload signature" />
          )} />
        </FormField>
      </div>
    </FormSection>
  );
}
