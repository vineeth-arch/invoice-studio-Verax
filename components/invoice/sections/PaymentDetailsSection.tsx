"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
}

export function PaymentDetailsSection({ control, register }: Props) {
  return (
    <FormSection title="Payment Details" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bank Name">
          <input type="text" className={inputClass} {...register("paymentDetails.bankName")} />
        </FormField>
        <FormField label="Account Holder Name">
          <input type="text" className={inputClass} {...register("paymentDetails.accountName")} />
        </FormField>
        <FormField label="Account Number">
          <input type="text" className={inputClass} {...register("paymentDetails.accountNumber")} />
        </FormField>
        <FormField label="IFSC Code">
          <input type="text" className={inputClass} placeholder="HDFC0001234" {...register("paymentDetails.ifscCode")} />
        </FormField>
        <FormField label="UPI ID">
          <input type="text" className={inputClass} placeholder="name@upi" {...register("paymentDetails.upiId")} />
        </FormField>
        <FormField label="Payment Link (optional)">
          <input type="url" className={inputClass} placeholder="https://..." {...register("paymentDetails.paymentLink")} />
        </FormField>
      </div>
      <FormField label="Payment QR Code (optional)">
        <Controller name="paymentDetails.upiQrImageBase64" control={control} render={({ field }) => (
          <FileUpload value={field.value} onChange={field.onChange} label="Upload UPI QR code" />
        )} />
      </FormField>
    </FormSection>
  );
}
