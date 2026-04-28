"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
}

export function TermsSignatureSection({ control, register, errors }: Props) {
  return (
    <FormSection title="Terms & Signature" defaultOpen={false}>
      <FormField label="Notes">
        <textarea className={textareaClass} placeholder="Any notes for the buyer..." {...register("notes")} />
      </FormField>
      <FormField label="Terms & Conditions">
        <textarea className={textareaClass} placeholder="Payment terms, delivery terms..." {...register("termsAndConditions")} />
      </FormField>
      <FormField label="Declaration (optional)">
        <textarea className={textareaClass} placeholder="Standard GST declaration..." {...register("declaration")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Authorized Signatory" required error={errors.signature?.signatoryName?.message}>
          <input type="text" className={inputClass} placeholder="Full name" {...register("signature.signatoryName")} />
        </FormField>
        <FormField label="Designation (optional)">
          <input type="text" className={inputClass} placeholder="Director, Manager..." {...register("signature.designation")} />
        </FormField>
      </div>
      <FormField label="Signature Image (optional)">
        <Controller name="signature.signatureImageBase64" control={control} render={({ field }) => (
          <FileUpload value={field.value} onChange={field.onChange} label="Upload signature" />
        )} />
      </FormField>
    </FormSection>
  );
}
