"use client";

import { useEffect } from "react";
import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { FileUpload } from "@/components/ui/FileUpload";
import type { PaymentMode } from "@/lib/types/common";

const TDS_SECTIONS = [
  { value: "194J", label: "194J — Professional/technical fees (10%)", rate: 10 },
  { value: "194C", label: "194C — Contractor payments (1%/2%)", rate: 2 },
  { value: "194H", label: "194H — Commission/brokerage (5%)", rate: 5 },
  { value: "194I", label: "194I — Rent (10%)", rate: 10 },
  { value: "194A", label: "194A — Interest (10%)", rate: 10 },
] as const;

const PAYMENT_MODES: PaymentMode[] = ["Cash", "NEFT", "RTGS", "UPI", "Cheque"];

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  isProforma: boolean;
}

export function PaymentDetailsSection({ control, register, setValue, isProforma }: Props) {
  const tdsApplicable = useWatch({ control, name: "tdsApplicable" }) ?? false;
  const tdsSection = useWatch({ control, name: "tdsSection" }) ?? "194J";
  const tdsRate = Number(useWatch({ control, name: "tdsRate" })) || 0;
  const paymentReceivedAmount = Number(useWatch({ control, name: "paymentReceivedAmount" })) || 0;
  const tdsDeducted = Number(useWatch({ control, name: "tdsDeducted" })) || 0;
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];
  const gstMode = useWatch({ control, name: "gstMode" }) ?? "CGST_SGST";
  const cess = Number(useWatch({ control, name: "cess" })) || 0;
  const otherCharges = Number(useWatch({ control, name: "otherCharges" })) || 0;

  const grandTotal = lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const gross = quantity * rate;
    const taxable = gross - (gross * discountPercent) / 100;
    const taxAmount = gstMode === "NO_TAX" ? 0 : (taxable * (Number(item.gstRate) || 0)) / 100;
    return sum + taxable + taxAmount;
  }, 0) + cess + otherCharges;

  useEffect(() => {
    if (!tdsApplicable) {
      setValue("tdsAmount", 0);
      setValue("netReceived", paymentReceivedAmount);
      return;
    }

    const computedTdsAmount = Number(((grandTotal * tdsRate) / 100).toFixed(2));
    const computedNetReceived = Number((paymentReceivedAmount + tdsDeducted).toFixed(2));
    const expectedCashReceived = Number((grandTotal - computedTdsAmount).toFixed(2));

    setValue("tdsAmount", computedTdsAmount);
    setValue("netReceived", computedNetReceived);

    if (paymentReceivedAmount > 0) {
      setValue("paymentStatus", paymentReceivedAmount >= expectedCashReceived ? "Paid" : "Partial");
    }
  }, [grandTotal, paymentReceivedAmount, setValue, tdsApplicable, tdsDeducted, tdsRate]);

  const selectedTdsPreset = TDS_SECTIONS.find((section) => section.value === tdsSection);

  return (
    <FormSection title="Payment Details" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Payment Status">
          <select className={inputClass} {...register("paymentStatus")}>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </FormField>
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
      {!isProforma && (
        <FormField label="Payment QR Code (optional)">
          <Controller name="paymentDetails.upiQrImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload UPI QR code" />
          )} />
        </FormField>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">TDS Applicable</div>
            <div className="text-xs text-slate-500">Track client-side tax deduction and payment settlement.</div>
          </div>
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...register("tdsApplicable")} />
        </label>

        {tdsApplicable && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">TDS Details</div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="TDS Section">
                  <select
                    className={inputClass}
                    value={selectedTdsPreset ? tdsSection : "CUSTOM"}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "CUSTOM") {
                        setValue("tdsSection", "");
                        return;
                      }
                      const preset = TDS_SECTIONS.find((section) => section.value === nextValue);
                      if (!preset) return;
                      setValue("tdsSection", preset.value);
                      setValue("tdsRate", preset.rate);
                    }}
                  >
                    {TDS_SECTIONS.map((section) => (
                      <option key={section.value} value={section.value}>{section.label}</option>
                    ))}
                    <option value="CUSTOM">Custom — enter manually</option>
                  </select>
                </FormField>
                {!selectedTdsPreset && (
                  <FormField label="Custom Section">
                    <input type="text" className={inputClass} placeholder="e.g. 194O" {...register("tdsSection")} />
                  </FormField>
                )}
                <FormField label="TDS Rate %">
                  <input type="number" min="0" step="any" className={inputClass} {...register("tdsRate")} />
                </FormField>
                <FormField label="TDS Amount">
                  <input type="number" min="0" step="any" className={inputClass} {...register("tdsAmount")} />
                </FormField>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Record Payment Received</div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Payment Received Date">
                  <input type="date" className={inputClass} {...register("paymentReceivedDate")} />
                </FormField>
                <FormField label="Amount Received">
                  <input type="number" min="0" step="any" className={inputClass} {...register("paymentReceivedAmount")} />
                </FormField>
                <FormField label="TDS Deducted by Client">
                  <input type="number" min="0" step="any" className={inputClass} {...register("tdsDeducted")} />
                </FormField>
                <FormField label="Net Received">
                  <input type="number" min="0" step="any" className={inputClass} value={Number((paymentReceivedAmount + tdsDeducted).toFixed(2))} readOnly />
                </FormField>
                <FormField label="Payment Mode">
                  <select className={inputClass} {...register("paymentMode")}>
                    <option value="">Select mode</option>
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Transaction Reference">
                  <input type="text" className={inputClass} placeholder="UTR / cheque / txn reference" {...register("transactionReference")} />
                </FormField>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}
