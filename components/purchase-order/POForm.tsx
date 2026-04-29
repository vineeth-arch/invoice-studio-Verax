"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useEffect, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { purchaseOrderSchema } from "@/lib/schemas/purchase-order.schema";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { BusinessProfile } from "@/lib/types/company";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import { calculatePOLineItem, calculatePOTotals } from "@/lib/utils/calculations";
import { PODetailsSection } from "./sections/PODetailsSection";
import { POBuyerSection } from "./sections/POBuyerSection";
import { POVendorSection } from "./sections/POVendorSection";
import { PODeliverySection } from "./sections/PODeliverySection";
import { POLineItemsSection } from "./sections/POLineItemsSection";
import { POTotalsSection } from "./sections/POTotalsSection";
import { POCommercialTermsSection } from "./sections/POCommercialTermsSection";
import { POAuthorizationSection } from "./sections/POAuthorizationSection";
import { Button } from "@/components/ui/Button";
import { useDocumentNumber } from "@/lib/hooks/useDocumentNumber";
import type { Invoice } from "@/lib/types/invoice";
import type { SavedClient } from "@/lib/types/client";
import { getStoredCompanyProfileForForms } from "@/lib/utils/companyProfileStorage";

interface POFormProps {
  initialValues?: Partial<PurchaseOrder>;
  settings: DocumentTemplateSettings | null;
  companyProfile: BusinessProfile | null;
  existingDocs: Array<Invoice | PurchaseOrder>;
  onSave: (values: POFormValues, status: "DRAFT" | "FINAL") => Promise<void>;
  isSaving?: boolean;
  onPreviewChange: (po: Partial<PurchaseOrder>) => void;
  isNewDocument?: boolean;
}

function buildDefaultValues(settings: DocumentTemplateSettings | null, profile: BusinessProfile | null, suggested: string): Partial<POFormValues> {
  return {
    poNumber: suggested,
    poDate: new Date().toISOString().slice(0, 10),
    validUntil: "",
    deliveryDate: "",
    poReference: "",
    placeOfSupply: "",
    placeOfSupplyCode: "",
    paymentTerms: "Net 30",
    deliveryTerms: "FOR Destination",
    status: "DRAFT",
    lineItems: [],
    otherCharges: 0,
    poStatus: "Under Approval",
    buyer: { name: "", address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" }, gstin: "", stateCode: "" },
    vendor: { name: "", address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" } },
    delivery: { address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" } },
    approvedBy: profile?.defaultSignatoryName ?? "",
    approvedBySignature: { signatureImageBase64: profile?.defaultSignatureImageBase64 },
    bankDetails: profile?.bankDetails ? {
      accountName: profile.bankDetails.accountName,
      accountNumber: profile.bankDetails.accountNumber,
      bankName: profile.bankDetails.bankName,
      branch: profile.bankDetails.branch,
      ifscCode: profile.bankDetails.ifscCode,
      upiId: profile.bankDetails.upiId,
    } : undefined,
    commercialTerms: { termsAndConditions: profile?.defaultTermsAndConditions },
  };
}

export function POForm({
  initialValues,
  settings,
  companyProfile,
  existingDocs,
  onSave,
  isSaving,
  onPreviewChange,
  isNewDocument = false,
}: POFormProps) {
  const { suggested, isDuplicate } = useDocumentNumber(settings?.poNumbering, existingDocs, initialValues?.id);
  const [useCompanyProfile, setUseCompanyProfile] = useState(true);
  const [storedCompanyProfile, setStoredCompanyProfile] = useState<BusinessProfile | null>(null);

  const defaultValues = useMemo(
    () => initialValues ? { ...buildDefaultValues(settings, companyProfile, suggested), ...initialValues } : buildDefaultValues(settings, companyProfile, suggested),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<POFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: defaultValues as POFormValues,
    mode: "onBlur",
  });

  const formValues = useWatch({ control });

  const previewPO = useMemo<Partial<PurchaseOrder>>(() => {
    const items = (formValues.lineItems ?? []).map((item) =>
      calculatePOLineItem({
        id: item.id ?? uuidv4(),
        description: item.description ?? "",
        hsnSac: item.hsnSac ?? "",
        quantity: Number(item.quantity) || 0,
        unit: item.unit ?? "PCS",
        rate: Number(item.rate) || 0,
        discountPercent: Number(item.discountPercent) || 0,
        gstRate: Number(item.gstRate) || 0,
      })
    );
    const totals = calculatePOTotals(items, Number(formValues.otherCharges) || 0);
    return { ...formValues, lineItems: items, totals } as Partial<PurchaseOrder>;
  }, [formValues]);

  useEffect(() => { onPreviewChange(previewPO); }, [previewPO, onPreviewChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSubmit((v) => onSave(v, "DRAFT"))(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, onSave]);

  const prefillFromProfile = useCallback((profile: BusinessProfile | null) => {
    if (!profile) return;
    setValue("buyer.name", profile.companyName);
    setValue("buyer.address", { ...profile.address, country: "India" });
    setValue("buyer.gstin", profile.gstin);
    setValue("buyer.stateCode", profile.address.stateCode);
    setValue("buyer.contact.email", profile.contact.email ?? "");
    setValue("buyer.contact.phone", profile.contact.phone ?? "");
    setValue("approvedBy", profile.defaultSignatoryName ?? "");
    setValue("approvedBySignature.signatureImageBase64", profile.defaultSignatureImageBase64 ?? "");
    if (profile.logoImageBase64) setValue("buyer.logoImageBase64", profile.logoImageBase64);
    if (profile.bankDetails) {
      setValue("bankDetails.bankName", profile.bankDetails.bankName ?? "");
      setValue("bankDetails.accountName", profile.bankDetails.accountName ?? "");
      setValue("bankDetails.accountNumber", profile.bankDetails.accountNumber ?? "");
      setValue("bankDetails.ifscCode", profile.bankDetails.ifscCode ?? "");
      setValue("bankDetails.branch", profile.bankDetails.branch ?? "");
      setValue("bankDetails.upiId", profile.bankDetails.upiId ?? "");
    }
  }, [setValue]);

  useEffect(() => {
    if (!isNewDocument || typeof window === "undefined") return;
    const storedProfile = getStoredCompanyProfileForForms();
    setStoredCompanyProfile(storedProfile);
    if (storedProfile) {
      prefillFromProfile(storedProfile);
    }
  }, [isNewDocument, prefillFromProfile]);

  const applySavedClient = useCallback((client: SavedClient | null) => {
    if (!client) {
      setValue("vendor.name", "");
      setValue("vendor.address.line1", "");
      setValue("vendor.address.line2", "");
      setValue("vendor.address.city", "");
      setValue("vendor.address.state", "");
      setValue("vendor.address.stateCode", "");
      setValue("vendor.address.pincode", "");
      setValue("vendor.gstin", "");
      setValue("vendor.contact.email", "");
      setValue("vendor.contact.phone", "");
      return;
    }
    setValue("vendor.name", client.name);
    setValue("vendor.address.line1", client.address1);
    setValue("vendor.address.line2", client.address2);
    setValue("vendor.address.city", client.city);
    setValue("vendor.address.state", client.state);
    setValue("vendor.address.stateCode", client.stateCode);
    setValue("vendor.address.pincode", client.pincode);
    setValue("vendor.gstin", client.gstin);
    setValue("vendor.contact.email", client.email);
    setValue("vendor.contact.phone", client.phone);
    setValue("placeOfSupply", client.placeOfSupply);
    setValue("placeOfSupplyCode", client.placeOfSupplyCode);
  }, [setValue]);

  return (
    <form className="space-y-3">
      <PODetailsSection control={control} register={register} errors={errors} isDuplicate={isDuplicate} />
      <POBuyerSection
        control={control}
        register={register}
        errors={errors}
        showCompanyProfileControls={isNewDocument}
        hasSavedProfile={isNewDocument && Boolean(storedCompanyProfile)}
        useCompanyProfile={isNewDocument && Boolean(storedCompanyProfile) ? useCompanyProfile : false}
        companyName={storedCompanyProfile?.companyName ?? companyProfile?.companyName}
        onUseCompanyProfileChange={(checked) => {
          setUseCompanyProfile(checked);
          if (checked) {
            prefillFromProfile(storedCompanyProfile ?? companyProfile);
          }
        }}
      />
      <POVendorSection control={control} register={register} errors={errors} onSelectSavedClient={applySavedClient} />
      <PODeliverySection register={register} errors={errors} />
      <POLineItemsSection control={control} setValue={setValue} errors={errors} />
      <POTotalsSection control={control} register={register} />
      <POCommercialTermsSection register={register} />
      <POAuthorizationSection control={control} register={register} errors={errors} />

      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-slate-500">Save as:</span>
        <Button
          type="button"
          variant="secondary"
          loading={isSaving}
          onClick={() => {
            setValue("status", "DRAFT");
            handleSubmit((v) => onSave(v, "DRAFT"))();
          }}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isSaving}
          onClick={() => {
            setValue("status", "FINAL");
            handleSubmit((v) => onSave(v, "FINAL"))();
          }}
        >
          Save as Final
        </Button>
      </div>
    </form>
  );
}
