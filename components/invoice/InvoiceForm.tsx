"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { invoiceSchema } from "@/lib/schemas/invoice.schema";
import type { Invoice } from "@/lib/types/invoice";
import type { GSTMode } from "@/lib/types/common";
import type { BusinessProfile } from "@/lib/types/company";
import { calculateLineItem, calculateInvoiceTotals } from "@/lib/utils/calculations";
import { InvoiceDetailsSection } from "./sections/InvoiceDetailsSection";
import { SupplierDetailsSection } from "./sections/SupplierDetailsSection";
import { BuyerDetailsSection } from "./sections/BuyerDetailsSection";
import { ShippingDetailsSection } from "./sections/ShippingDetailsSection";
import { LineItemsSection } from "./sections/LineItemsSection";
import { TotalsSummarySection } from "./sections/TotalsSummarySection";
import { PaymentDetailsSection } from "./sections/PaymentDetailsSection";
import { TermsSignatureSection } from "./sections/TermsSignatureSection";
import { Button } from "@/components/ui/Button";
import { useDocumentNumber } from "@/lib/hooks/useDocumentNumber";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

interface InvoiceFormProps {
  initialValues?: Partial<Invoice>;
  settings: DocumentTemplateSettings | null;
  companyProfile: BusinessProfile | null;
  existingDocs: Array<Invoice | PurchaseOrder>;
  onSave: (values: InvoiceFormValues, status: "DRAFT" | "FINAL") => Promise<void>;
  isSaving?: boolean;
  onPreviewChange: (invoice: Partial<Invoice>) => void;
}

function buildDefaultValues(
  settings: DocumentTemplateSettings | null,
  profile: BusinessProfile | null,
  suggested: string
): Partial<InvoiceFormValues> {
  return {
    invoiceType: "TAX_INVOICE",
    invoiceNumber: suggested,
    invoiceDate: new Date().toISOString().slice(0, 10),
    reverseCharge: false,
    gstMode: settings?.defaultGSTMode ?? "CGST_SGST",
    cess: 0,
    otherCharges: 0,
    status: "DRAFT",
    shipping: { sameAsBilling: true },
    lineItems: [],
    supplier: profile
      ? {
          name: profile.companyName,
          address: { ...profile.address, country: "India" },
          gstin: profile.gstin,
          stateCode: profile.address.stateCode,
          contact: { email: profile.contact.email, phone: profile.contact.phone, website: profile.contact.website },
          pan: profile.pan,
          logoImageBase64: profile.logoImageBase64,
        }
      : { name: "", address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" }, gstin: "", stateCode: "", contact: {} },
    buyer: { name: "", billingAddress: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" }, placeOfSupply: "", placeOfSupplyCode: "" },
    signature: {
      signatoryName: profile?.defaultSignatoryName ?? "",
      signatureImageBase64: profile?.defaultSignatureImageBase64,
    },
    termsAndConditions: profile?.defaultTermsAndConditions ?? settings?.defaultTermsAndConditions,
    declaration: profile?.defaultDeclaration ?? settings?.defaultDeclaration,
    notes: settings?.defaultNotes,
    paymentDetails: profile?.bankDetails ? {
      accountName: profile.bankDetails.accountName,
      accountNumber: profile.bankDetails.accountNumber,
      bankName: profile.bankDetails.bankName,
      branch: profile.bankDetails.branch,
      ifscCode: profile.bankDetails.ifscCode,
      upiId: profile.bankDetails.upiId,
      paymentLink: profile.bankDetails.paymentLink,
      upiQrImageBase64: profile.bankDetails.upiQrImageBase64,
    } : undefined,
  };
}

export function InvoiceForm({
  initialValues,
  settings,
  companyProfile,
  existingDocs,
  onSave,
  isSaving,
  onPreviewChange,
}: InvoiceFormProps) {
  const { suggested, isDuplicate } = useDocumentNumber(
    settings?.invoiceNumbering,
    existingDocs,
    initialValues?.id
  );

  const defaultValues = useMemo(
    () => initialValues
      ? { ...buildDefaultValues(settings, companyProfile, suggested), ...initialValues }
      : buildDefaultValues(settings, companyProfile, suggested),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues as InvoiceFormValues,
    mode: "onBlur",
  });

  const formValues = useWatch({ control });

  // Build preview invoice from form values
  const previewInvoice = useMemo<Partial<Invoice>>(() => {
    const items = (formValues.lineItems ?? []).map((item) =>
      calculateLineItem(
        {
          id: item.id ?? uuidv4(),
          description: item.description ?? "",
          hsnSac: item.hsnSac ?? "",
          quantity: Number(item.quantity) || 0,
          unit: item.unit ?? "PCS",
          rate: Number(item.rate) || 0,
          discountPercent: Number(item.discountPercent) || 0,
          gstRate: Number(item.gstRate) || 0,
        },
        (formValues.gstMode ?? "CGST_SGST") as GSTMode
      )
    );
    const totals = calculateInvoiceTotals(
      items,
      Number(formValues.cess) || 0,
      Number(formValues.otherCharges) || 0
    );
    return { ...formValues, lineItems: items, totals } as Partial<Invoice>;
  }, [formValues]);

  useEffect(() => {
    onPreviewChange(previewInvoice);
  }, [previewInvoice, onPreviewChange]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit((v) => onSave(v, "DRAFT"))();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, onSave]);

  const prefillFromProfile = useCallback(() => {
    if (!companyProfile) return;
    setValue("supplier.name", companyProfile.companyName);
    setValue("supplier.address", { ...companyProfile.address, country: "India" });
    setValue("supplier.gstin", companyProfile.gstin);
    setValue("supplier.stateCode", companyProfile.address.stateCode);
    setValue("supplier.contact.email", companyProfile.contact.email ?? "");
    setValue("supplier.contact.phone", companyProfile.contact.phone ?? "");
    setValue("supplier.pan", companyProfile.pan ?? "");
    setValue("supplier.logoImageBase64", companyProfile.logoImageBase64 ?? "");
    setValue("signature.signatoryName", companyProfile.defaultSignatoryName ?? "");
    setValue("signature.signatureImageBase64", companyProfile.defaultSignatureImageBase64 ?? "");
    if (companyProfile.bankDetails) {
      setValue("paymentDetails.bankName", companyProfile.bankDetails.bankName);
      setValue("paymentDetails.accountName", companyProfile.bankDetails.accountName);
      setValue("paymentDetails.accountNumber", companyProfile.bankDetails.accountNumber);
      setValue("paymentDetails.ifscCode", companyProfile.bankDetails.ifscCode);
      setValue("paymentDetails.upiId", companyProfile.bankDetails.upiId ?? "");
    }
  }, [companyProfile, setValue]);

  return (
    <form className="space-y-3">
      {companyProfile && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={prefillFromProfile}>
            ↑ Use Company Profile
          </Button>
        </div>
      )}

      <InvoiceDetailsSection
        control={control} register={register} errors={errors} isDuplicate={isDuplicate}
      />
      <SupplierDetailsSection control={control} register={register} errors={errors} />
      <BuyerDetailsSection control={control} register={register} errors={errors} />
      <ShippingDetailsSection register={register} watch={watch} setValue={setValue} />
      <LineItemsSection control={control} setValue={setValue} errors={errors} />
      <TotalsSummarySection control={control} register={register} />
      <PaymentDetailsSection control={control} register={register} />
      <TermsSignatureSection control={control} register={register} errors={errors} />

      {/* Status selector */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-slate-500">Save as:</span>
        <Button
          type="button"
          variant="secondary"
          loading={isSaving}
          onClick={handleSubmit((v) => onSave(v, "DRAFT"))}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isSaving}
          onClick={handleSubmit((v) => onSave(v, "FINAL"))}
        >
          Save as Final
        </Button>
      </div>
    </form>
  );
}
