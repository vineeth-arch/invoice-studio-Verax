"use client";

import { useEffect, useMemo } from "react";
import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { FileUpload } from "@/components/ui/FileUpload";
import type { PaymentMode } from "@/lib/types/common";
import {
  deriveCollectionState,
  derivePaymentStatus,
  getBaseExpectedAmount,
  getBasePendingAmount,
  getGstPendingFromClient,
  getInvoiceClearedDate,
  getInvoiceGstAmount,
  normalizeInvoiceSettlement,
} from "@/lib/utils/invoiceClearance";

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

function round2(value: number) {
  return Number(value.toFixed(2));
}

export function PaymentDetailsSection({ control, register, setValue, isProforma }: Props) {
  const tdsApplicable = useWatch({ control, name: "tdsApplicable" }) ?? false;
  const tdsSection = useWatch({ control, name: "tdsSection" }) ?? "194J";
  const tdsRate = Number(useWatch({ control, name: "tdsRate" })) || 0;
  const tdsDeducted = Number(useWatch({ control, name: "tdsDeducted" })) || 0;
  const watchedLineItems = useWatch({ control, name: "lineItems" });
  const gstMode = useWatch({ control, name: "gstMode" }) ?? "CGST_SGST";
  const cess = Number(useWatch({ control, name: "cess" })) || 0;
  const otherCharges = Number(useWatch({ control, name: "otherCharges" })) || 0;
  const baseClearedAmount = Number(useWatch({ control, name: "baseClearedAmount" })) || 0;
  const baseClearedDate = useWatch({ control, name: "baseClearedDate" }) ?? "";
  const gstCollectionMode = useWatch({ control, name: "gstCollectionMode" }) ?? "standard";
  const gstRecoveredAmount = Number(useWatch({ control, name: "gstRecoveredAmount" })) || 0;
  const gstRecoveredDate = useWatch({ control, name: "gstRecoveredDate" }) ?? "";

  const settlementSnapshot = useMemo(() => {
    const lineItems = watchedLineItems ?? [];
    const taxableValue = lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const gross = quantity * rate;
      return sum + (gross - (gross * discountPercent) / 100);
    }, 0);
    const computedGstAmount = gstMode === "NO_TAX" || isProforma
      ? 0
      : round2(
          lineItems.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            const discountPercent = Number(item.discountPercent) || 0;
            const gross = quantity * rate;
            const taxable = gross - (gross * discountPercent) / 100;
            return sum + taxable * ((Number(item.gstRate) || 0) / 100);
          }, 0)
        );
    const grandTotal = round2(taxableValue + computedGstAmount + cess + otherCharges);
    const gstAmount = computedGstAmount;

    const computedTdsAmount = tdsApplicable ? round2((grandTotal || 0) * (tdsRate / 100)) : 0;

    const normalized = normalizeInvoiceSettlement({
      gstMode: isProforma ? "NO_TAX" : gstMode,
      totals: {
        grandTotal,
        totalCGST: gstMode === "CGST_SGST" ? gstAmount / 2 : 0,
        totalSGST: gstMode === "CGST_SGST" ? gstAmount / 2 : 0,
        totalIGST: gstMode === "IGST" || gstMode === "CUSTOM" ? gstAmount : 0,
      } as never,
      tdsAmount: computedTdsAmount,
      tdsDeducted,
      paymentReceivedAmount: baseClearedAmount,
      paymentReceivedDate: baseClearedDate,
      baseClearedAmount,
      baseClearedDate,
      gstCollectionMode,
      gstRecoveredAmount,
      gstRecoveredDate,
    });

    return {
      gstAmount: getInvoiceGstAmount(normalized),
      taxableInvoice: !isProforma && gstMode !== "NO_TAX" && gstAmount > 0,
      computedTdsAmount,
      baseExpectedAmount: getBaseExpectedAmount(normalized),
      basePendingAmount: getBasePendingAmount(normalized),
      gstPendingAmount: getGstPendingFromClient(normalized),
      paymentStatus: derivePaymentStatus(normalized),
      collectionState: deriveCollectionState(normalized),
      invoiceClearedDate: getInvoiceClearedDate(normalized) ?? "",
      normalizedGstRecoveredAmount: normalized.gstRecoveredAmount,
      netReceived: round2(baseClearedAmount + normalized.gstRecoveredAmount + tdsDeducted),
    };
  }, [
    watchedLineItems,
    gstMode,
    isProforma,
    cess,
    otherCharges,
    tdsApplicable,
    tdsRate,
    tdsDeducted,
    baseClearedAmount,
    baseClearedDate,
    gstCollectionMode,
    gstRecoveredAmount,
    gstRecoveredDate,
  ]);

  useEffect(() => {
    setValue("tdsAmount", settlementSnapshot.computedTdsAmount);
    setValue("paymentReceivedAmount", baseClearedAmount);
    setValue("paymentReceivedDate", baseClearedDate);
    setValue("netReceived", settlementSnapshot.netReceived);

    if (!settlementSnapshot.taxableInvoice) {
      setValue("gstCollectionMode", "standard");
      setValue("gstRecoveredAmount", 0);
      setValue("gstRecoveredDate", "");
    } else if (gstCollectionMode === "standard") {
      setValue("gstRecoveredAmount", settlementSnapshot.gstAmount);
      if (!gstRecoveredDate && baseClearedDate) {
        setValue("gstRecoveredDate", baseClearedDate);
      }
    } else {
      setValue("gstRecoveredAmount", settlementSnapshot.normalizedGstRecoveredAmount);
    }

    setValue("invoiceClearedDate", settlementSnapshot.invoiceClearedDate);
    setValue("paymentStatus", settlementSnapshot.paymentStatus as InvoiceFormValues["paymentStatus"]);
  }, [
    baseClearedAmount,
    baseClearedDate,
    gstCollectionMode,
    gstRecoveredDate,
    setValue,
    settlementSnapshot,
  ]);

  const selectedTdsPreset = TDS_SECTIONS.find((section) => section.value === tdsSection);

  return (
    <FormSection title="Payment Details" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Payment Status (auto)">
          <input type="text" className={inputClass} value={settlementSnapshot.paymentStatus} readOnly />
        </FormField>
        <FormField label="Collection State (auto)">
          <input type="text" className={inputClass} value={settlementSnapshot.collectionState} readOnly />
        </FormField>
        <FormField label="Invoice Cleared On (auto)">
          <input type="text" className={inputClass} value={settlementSnapshot.invoiceClearedDate || "Pending"} readOnly />
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
          <Controller
            name="paymentDetails.upiQrImageBase64"
            control={control}
            render={({ field }) => (
              <FileUpload value={field.value} onChange={field.onChange} label="Upload UPI QR code" />
            )}
          />
        </FormField>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Base Payment Clearance</div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Base Amount Expected">
            <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.baseExpectedAmount} readOnly />
          </FormField>
          <FormField label="Base Pending">
            <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.basePendingAmount} readOnly />
          </FormField>
          <FormField label="Base Amount Cleared">
            <input type="number" min="0" step="any" className={inputClass} {...register("baseClearedAmount")} />
          </FormField>
          <FormField label="Base Cleared Date">
            <input type="date" className={inputClass} {...register("baseClearedDate")} />
          </FormField>
          <FormField label="TDS Deducted by Client">
            <input type="number" min="0" step="any" className={inputClass} {...register("tdsDeducted")} />
          </FormField>
          <FormField label="Net Received">
            <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.netReceived} readOnly />
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

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">TDS Applicable</div>
            <div className="text-xs text-slate-500">Track client-side tax deduction and settlement.</div>
          </div>
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...register("tdsApplicable")} />
        </label>

        {tdsApplicable && (
          <div className="mt-4">
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
              <FormField label="TDS Amount (auto)">
                <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.computedTdsAmount} readOnly />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {settlementSnapshot.taxableInvoice && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">GST Recovery From Client</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="GST Recovery Mode">
              <select className={inputClass} {...register("gstCollectionMode")}>
                <option value="standard">Standard</option>
                <option value="deferred">Deferred</option>
              </select>
            </FormField>
            <FormField label="GST Amount on Invoice">
              <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.gstAmount} readOnly />
            </FormField>
            <FormField label="GST Recovered Amount">
              <input
                type="number"
                min="0"
                max={settlementSnapshot.gstAmount}
                step="any"
                className={inputClass}
                {...register("gstRecoveredAmount")}
                readOnly={gstCollectionMode === "standard"}
              />
            </FormField>
            <FormField label="GST Pending From Client">
              <input type="number" min="0" step="any" className={inputClass} value={settlementSnapshot.gstPendingAmount} readOnly />
            </FormField>
            <FormField label="GST Recovered Date">
              <input type="date" className={inputClass} {...register("gstRecoveredDate")} />
            </FormField>
            <FormField label="GST Fully Recovered">
              <input
                type="text"
                className={inputClass}
                value={settlementSnapshot.gstPendingAmount <= 0.01 ? "Yes" : "No"}
                readOnly
              />
            </FormField>
          </div>
        </div>
      )}

      <FormField label="Settlement Notes (internal only)">
        <textarea
          className={textareaClass}
          placeholder="Add internal notes for base clearance, GST follow-up, or reconciliation."
          {...register("settlementNotes")}
        />
      </FormField>
    </FormSection>
  );
}
