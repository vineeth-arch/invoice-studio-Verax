"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { NumberingInput } from "@/components/ui/NumberingInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { isValidInvoiceNumber } from "@/lib/utils/validation";
import { InvoiceReferenceCombobox, type InvoiceReferenceOption } from "@/components/ui/InvoiceReferenceCombobox";
import { formatCurrencyINR } from "@/lib/utils/formatting";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  isDuplicate: (num: string) => boolean;
  isProforma: boolean;
  isCreditNote: boolean;
  invoiceReferenceOptions: InvoiceReferenceOption[];
  linkedInvoiceId?: string;
  linkedInvoiceAmount?: number;
  onSelectLinkedInvoice: (invoiceId: string) => void;
}

const invoiceTypes = [
  { value: "PROFORMA", label: "Proforma Invoice" },
  { value: "TAX_INVOICE", label: "Tax Invoice" },
  { value: "BILL_OF_SUPPLY", label: "Bill of Supply" },
  { value: "EXPORT_INVOICE", label: "Export Invoice" },
  { value: "CREDIT_NOTE", label: "Credit Note" },
  { value: "DEBIT_NOTE", label: "Debit Note" },
];

export function InvoiceDetailsSection({
  control,
  register,
  errors,
  isDuplicate,
  isProforma,
  isCreditNote,
  invoiceReferenceOptions,
  linkedInvoiceId,
  linkedInvoiceAmount,
  onSelectLinkedInvoice,
}: Props) {
  return (
    <FormSection title="Invoice Details">
      {isCreditNote && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <FormField label="Original Invoice Reference" required error={errors.linkedInvoiceId?.message}>
            <InvoiceReferenceCombobox
              options={invoiceReferenceOptions}
              value={linkedInvoiceId ? invoiceReferenceOptions.find((option) => option.id === linkedInvoiceId)?.invoiceNumber ?? "" : ""}
              onChange={() => undefined}
              onSelect={(option) => onSelectLinkedInvoice(option.id)}
            />
          </FormField>
          {linkedInvoiceAmount !== undefined && (
            <div className="mt-2 text-sm text-slate-600">Original invoice value: {formatCurrencyINR(linkedInvoiceAmount)}</div>
          )}
          <div className="mt-3">
            <FormField label="Credit Reason" required error={errors.creditReason?.message}>
              <input type="text" className={inputClass} placeholder="Service not delivered, billing error, discount adjustment..." {...register("creditReason")} />
            </FormField>
          </div>
        </div>
      )}

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

        <FormField label={isProforma ? "Valid Until" : "Due Date"} error={errors.dueDate?.message}>
          <input type="date" className={inputClass} {...register("dueDate")} />
        </FormField>

        <FormField label="PO Reference" error={errors.poReference?.message}>
          <input type="text" className={inputClass} placeholder="PO-2026-001" {...register("poReference")} />
        </FormField>

        <FormField label="Project Description (optional)" error={errors.projectDescription?.message}>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Brand identity design consultancy for ABC Foods"
            maxLength={120}
            {...register("projectDescription")}
          />
        </FormField>

        {!isProforma && (
          <>
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
          </>
        )}
      </div>

      {!isProforma && (
        <FormField label="E-Invoice QR Code (optional)" hint="Upload only if you have an official GST e-invoice QR code">
          <Controller name="irnQrImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload QR code image" />
          )} />
        </FormField>
      )}
    </FormSection>
  );
}
