"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { NumberingInput } from "@/components/ui/NumberingInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { isValidInvoiceNumber } from "@/lib/utils/validation";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  isDuplicate: (num: string) => boolean;
}

const invoiceTypes = [
  { value: "TAX_INVOICE", label: "Tax Invoice" },
  { value: "BILL_OF_SUPPLY", label: "Bill of Supply" },
  { value: "EXPORT_INVOICE", label: "Export Invoice" },
  { value: "CREDIT_NOTE", label: "Credit Note" },
  { value: "DEBIT_NOTE", label: "Debit Note" },
];

export function InvoiceDetailsSection({ control, register, errors, isDuplicate }: Props) {
  return (
    <FormSection title="Invoice Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Invoice Type" required error={errors.invoiceType?.message}>
          <select className={selectClass} {...register("invoiceType")}>
            {invoiceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FormField>

        <FormField label="Invoice Number" required error={errors.invoiceNumber?.message}
          hint="Max 16 chars. Letters, numbers, / and - only.">
          <Controller name="invoiceNumber" control={control} render={({ field }) => (
            <NumberingInput
              {...field}
              isDuplicate={isDuplicate(field.value)}
              isInvalid={field.value ? !isValidInvoiceNumber(field.value) : false}
            />
          )} />
        </FormField>

        <FormField label="Invoice Date" required error={errors.invoiceDate?.message}>
          <input type="date" className={inputClass} {...register("invoiceDate")} />
        </FormField>

        <FormField label="Due Date" error={errors.dueDate?.message}>
          <input type="date" className={inputClass} {...register("dueDate")} />
        </FormField>

        <FormField label="PO Reference" error={errors.poReference?.message}>
          <input type="text" className={inputClass} placeholder="PO-2026-001" {...register("poReference")} />
        </FormField>

        <FormField label="E-Way Bill Number" error={errors.ewayBillNumber?.message}>
          <input type="text" className={inputClass} placeholder="EWB number" {...register("ewayBillNumber")} />
        </FormField>

        <FormField label="Reverse Charge">
          <select className={selectClass} {...register("reverseCharge", { setValueAs: (v) => v === "true" })}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </FormField>

        <FormField label="IRN Number (optional)">
          <input type="text" className={inputClass} placeholder="Invoice Reference Number" {...register("irnNumber")} />
        </FormField>
      </div>

      <FormField label="E-Invoice QR Code (optional)" hint="Upload only if you have an official GST e-invoice QR code">
        <Controller name="irnQrImageBase64" control={control} render={({ field }) => (
          <FileUpload value={field.value} onChange={field.onChange} label="Upload QR code image" />
        )} />
      </FormField>
    </FormSection>
  );
}
