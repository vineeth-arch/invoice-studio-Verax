"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { X } from "lucide-react";
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
import { useSavedClients } from "@/lib/hooks/useSavedClients";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { useToast } from "@/lib/hooks/useToast";
import type { SavedClient } from "@/lib/types/client";
import { resolveInvoiceType } from "@/lib/utils/invoiceTypes";
import type { InvoiceReferenceOption } from "@/components/ui/InvoiceReferenceCombobox";
import { getStoredCompanyProfileForForms } from "@/lib/utils/companyProfileStorage";
import { hasNonEmptyValue, INVOICE_WIP_SESSION_KEY } from "@/lib/utils/drafts";
import { normalizeInvoiceSettlement } from "@/lib/utils/invoiceClearance";

interface InvoiceFormProps {
  initialValues?: Partial<Invoice>;
  settings: DocumentTemplateSettings | null;
  companyProfile: BusinessProfile | null;
  existingDocs: Array<Invoice | PurchaseOrder>;
  onSave: (
    values: InvoiceFormValues,
    status: "DRAFT" | "FINAL",
    options?: { silent?: boolean; stayOnPage?: boolean }
  ) => Promise<{ success: boolean; id?: string }>;
  isSaving?: boolean;
  onPreviewChange: (invoice: Partial<Invoice>) => void;
  isNewDocument?: boolean;
  onAutoSaveStateChange?: (state: "idle" | "saved") => void;
  conversionSourcePoReference?: string;
}

function buildDefaultValues(
  settings: DocumentTemplateSettings | null,
  profile: BusinessProfile | null,
  suggested: string
): Partial<InvoiceFormValues> {
  return {
    invoiceType: resolveInvoiceType({ documentType: "tax_invoice" }),
    invoiceNumber: suggested,
    invoiceDate: new Date().toISOString().slice(0, 10),
    reverseCharge: false,
    gstMode: settings?.defaultGSTMode ?? "CGST_SGST",
    cess: 0,
    otherCharges: 0,
    status: "DRAFT",
    paymentStatus: "Unpaid",
    baseClearedAmount: 0,
    baseClearedDate: "",
    gstCollectionMode: "standard",
    gstRecoveredAmount: 0,
    gstRecoveredDate: "",
    invoiceClearedDate: "",
    settlementNotes: "",
    tdsApplicable: false,
    tdsSection: "194J",
    tdsRate: 10,
    tdsAmount: 0,
    paymentReceivedAmount: 0,
    tdsDeducted: 0,
    netReceived: 0,
    creditNoteRefs: [],
    shipping: { sameAsBilling: true },
    lineItems: [],
    supplier: { name: "", address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" }, gstin: "", stateCode: "", contact: {} },
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
  isNewDocument = false,
  onAutoSaveStateChange,
  conversionSourcePoReference,
}: InvoiceFormProps) {
  const { suggested, isDuplicate } = useDocumentNumber(
    settings?.invoiceNumbering,
    existingDocs,
    initialValues?.id
  );
  const { saveBuyerFromInvoice } = useSavedClients();
  const { addToast } = useToast();
  const [savingClient, setSavingClient] = useState(false);
  const [useCompanyProfile, setUseCompanyProfile] = useState(true);
  const [storedCompanyProfile, setStoredCompanyProfile] = useState<BusinessProfile | null>(null);
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [showConversionBanner, setShowConversionBanner] = useState(Boolean(conversionSourcePoReference));
  const sessionWriteReadyRef = useRef(false);
  const autoSaveReadyRef = useRef(false);

  const defaultValues = useMemo(
    () => initialValues
      ? normalizeInvoiceSettlement({ ...buildDefaultValues(settings, companyProfile, suggested), ...initialValues } as Partial<Invoice>)
      : buildDefaultValues(settings, companyProfile, suggested),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { control, register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues as InvoiceFormValues,
    mode: "onBlur",
  });

  const formValues = useWatch({ control });
  const isProforma = (formValues.invoiceType ?? "TAX_INVOICE") === "PROFORMA";
  const isCreditNote = (formValues.invoiceType ?? "TAX_INVOICE") === "CREDIT_NOTE";

  useEffect(() => {
    if (!isProforma) return;
    setValue("gstMode", "NO_TAX");
    setValue("cess", 0);
    setValue("reverseCharge", false);
  }, [isProforma, setValue]);

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

  const prefillFromProfile = useCallback((profile: BusinessProfile | null) => {
    if (!profile) return;
    setValue("supplier.name", profile.companyName);
    setValue("supplier.address", { ...profile.address, country: "India" });
    setValue("supplier.gstin", profile.gstin);
    setValue("supplier.stateCode", profile.address.stateCode);
    setValue("supplier.contact.email", profile.contact.email ?? "");
    setValue("supplier.contact.phone", profile.contact.phone ?? "");
    setValue("supplier.contact.website", profile.contact.website ?? "");
    setValue("supplier.pan", profile.pan ?? "");
    setValue("supplier.logoImageBase64", profile.logoImageBase64 ?? "");
    setValue("signature.signatoryName", profile.defaultSignatoryName ?? "");
    setValue("signature.signatureImageBase64", profile.defaultSignatureImageBase64 ?? "");
    if (profile.bankDetails) {
      setValue("paymentDetails.bankName", profile.bankDetails.bankName);
      setValue("paymentDetails.accountName", profile.bankDetails.accountName);
      setValue("paymentDetails.accountNumber", profile.bankDetails.accountNumber);
      setValue("paymentDetails.ifscCode", profile.bankDetails.ifscCode);
      setValue("paymentDetails.upiId", profile.bankDetails.upiId ?? "");
    }
  }, [setValue]);

  useEffect(() => {
    if (!isNewDocument || typeof window === "undefined") return;
    const storedProfile = getStoredCompanyProfileForForms();
    setStoredCompanyProfile(storedProfile);
    setHasRecoverableDraft(Boolean(window.sessionStorage.getItem(INVOICE_WIP_SESSION_KEY)));
    if (storedProfile) {
      prefillFromProfile(storedProfile);
    }
  }, [isNewDocument, prefillFromProfile]);

  useEffect(() => {
    if (!isNewDocument || !useCompanyProfile) return;

    const profileToUse = storedCompanyProfile ?? companyProfile;
    if (profileToUse) {
      prefillFromProfile(profileToUse);
    }
  }, [companyProfile, isNewDocument, prefillFromProfile, storedCompanyProfile, useCompanyProfile]);

  useEffect(() => {
    setShowConversionBanner(Boolean(conversionSourcePoReference));
  }, [conversionSourcePoReference]);

  const applySavedClient = useCallback((selected: SavedClient | null) => {
    if (!selected) {
      setValue("buyer.name", "");
      setValue("buyer.billingAddress.line1", "");
      setValue("buyer.billingAddress.line2", "");
      setValue("buyer.billingAddress.city", "");
      setValue("buyer.billingAddress.state", "");
      setValue("buyer.billingAddress.stateCode", "");
      setValue("buyer.billingAddress.pincode", "");
      setValue("buyer.gstin", "");
      setValue("buyer.placeOfSupply", "");
      setValue("buyer.placeOfSupplyCode", "");
      setValue("buyer.contact.email", "");
      setValue("buyer.contact.phone", "");
      return;
    }

    setValue("buyer.name", selected.name);
    setValue("buyer.billingAddress.line1", selected.address1);
    setValue("buyer.billingAddress.line2", selected.address2);
    setValue("buyer.billingAddress.city", selected.city);
    setValue("buyer.billingAddress.state", selected.state);
    setValue("buyer.billingAddress.stateCode", selected.stateCode);
    setValue("buyer.billingAddress.pincode", selected.pincode);
    setValue("buyer.gstin", selected.gstin);
    setValue("buyer.placeOfSupply", selected.placeOfSupply);
    setValue("buyer.placeOfSupplyCode", selected.placeOfSupplyCode);
    setValue("buyer.contact.email", selected.email);
    setValue("buyer.contact.phone", selected.phone);
    setValue("shipping.sameAsBilling", true);
  }, [setValue]);

  const handleSaveClient = useCallback(async () => {
    setSavingClient(true);
    try {
      const result = await saveBuyerFromInvoice(formValues.buyer);
      if (result.success) {
        addToast("Client saved successfully.", "success");
      } else {
        addToast(result.error ?? "Failed to save client.", "error");
      }
    } finally {
      setSavingClient(false);
    }
  }, [saveBuyerFromInvoice, formValues.buyer, addToast]);

  const invoiceReferenceOptions = useMemo<InvoiceReferenceOption[]>(
    () => existingDocs
      .filter((doc): doc is Invoice => "invoiceNumber" in doc)
      .filter((doc) => doc.id !== initialValues?.id && doc.status !== "CANCELLED")
      .map((doc) => ({
        id: doc.id,
        invoiceNumber: doc.invoiceNumber,
        buyerName: doc.buyer.name,
        amount: doc.totals.grandTotal,
      })),
    [existingDocs, initialValues?.id]
  );

  const handleLinkedInvoiceSelect = useCallback((selectedId: string) => {
    const linkedInvoice = existingDocs.find((doc): doc is Invoice => "invoiceNumber" in doc && doc.id === selectedId);
    if (!linkedInvoice) return;

    setValue("linkedInvoiceId", linkedInvoice.id);
    setValue("linkedInvoiceNumber", linkedInvoice.invoiceNumber);
    setValue("linkedInvoiceDate", linkedInvoice.invoiceDate);
    setValue("buyer.name", linkedInvoice.buyer.name);
    setValue("buyer.billingAddress", linkedInvoice.buyer.billingAddress);
    setValue("buyer.gstin", linkedInvoice.buyer.gstin ?? "");
    setValue("buyer.contact", linkedInvoice.buyer.contact ?? {});
    setValue("buyer.placeOfSupply", linkedInvoice.buyer.placeOfSupply);
    setValue("buyer.placeOfSupplyCode", linkedInvoice.buyer.placeOfSupplyCode);
  }, [existingDocs, setValue]);

  const handleValidationError = useCallback((validationErrors: unknown) => {
    console.error("[InvoiceForm] validation blocked save", validationErrors);
  }, []);

  const triggerDraftSave = useCallback(() => {
    setValue("status", "DRAFT");
    void onSave(getValues() as InvoiceFormValues, "DRAFT");
  }, [getValues, onSave, setValue]);

  const restoreSessionDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(INVOICE_WIP_SESSION_KEY);
      if (!raw) return;
      const values = JSON.parse(raw) as InvoiceFormValues;
      reset(values);
      setHasRecoverableDraft(false);
    } catch {
      setHasRecoverableDraft(false);
    }
  }, [reset]);

  const dismissSessionDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(INVOICE_WIP_SESSION_KEY);
    setHasRecoverableDraft(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!sessionWriteReadyRef.current) {
      sessionWriteReadyRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.sessionStorage.setItem(INVOICE_WIP_SESSION_KEY, JSON.stringify(getValues()));
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [formValues, getValues]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!autoSaveReadyRef.current) {
      autoSaveReadyRef.current = true;
      return;
    }

    onAutoSaveStateChange?.("idle");
    if (!hasNonEmptyValue(formValues.invoiceNumber)) return;

    const timeoutId = window.setTimeout(() => {
      setValue("status", "DRAFT");
      void onSave(getValues() as InvoiceFormValues, "DRAFT", { silent: true, stayOnPage: true }).then((result) => {
        if (result.success) {
          onAutoSaveStateChange?.("saved");
        }
      });
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [formValues, getValues, onAutoSaveStateChange, onSave, setValue]);

  return (
    <form className="space-y-3">
      {showConversionBanner && conversionSourcePoReference && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-blue-900">
              Converted from PO: {conversionSourcePoReference}. Review all details before saving.
            </p>
            <button
              type="button"
              onClick={() => setShowConversionBanner(false)}
              className="rounded-md p-1 text-blue-700 transition-colors hover:bg-blue-100"
              aria-label="Dismiss conversion notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {isNewDocument && hasRecoverableDraft && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-amber-900">
              You have an unsaved draft from your last session.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={restoreSessionDraft}>
                Restore
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={dismissSessionDraft}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
      <InvoiceDetailsSection
        control={control}
        register={register}
        errors={errors}
        isDuplicate={isDuplicate}
        isProforma={isProforma}
        isCreditNote={isCreditNote}
        invoiceReferenceOptions={invoiceReferenceOptions}
        linkedInvoiceId={formValues.linkedInvoiceId}
        linkedInvoiceAmount={invoiceReferenceOptions.find((option) => option.id === formValues.linkedInvoiceId)?.amount}
        onSelectLinkedInvoice={handleLinkedInvoiceSelect}
      />
      <SupplierDetailsSection
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        showCompanyProfileControls={isNewDocument}
        hasSavedProfile={isNewDocument && Boolean(storedCompanyProfile ?? companyProfile)}
        useCompanyProfile={isNewDocument && Boolean(storedCompanyProfile ?? companyProfile) ? useCompanyProfile : false}
        companyName={storedCompanyProfile?.companyName ?? companyProfile?.companyName}
        onUseCompanyProfileChange={(checked) => {
          setUseCompanyProfile(checked);
          if (checked) {
            prefillFromProfile(storedCompanyProfile ?? companyProfile);
          }
        }}
      />
      <BuyerDetailsSection
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        isProforma={isProforma}
        onSelectSavedClient={applySavedClient}
        onSaveClient={handleSaveClient}
        savingClient={savingClient}
      />
      <ShippingDetailsSection register={register} watch={watch} setValue={setValue} />
      <LineItemsSection control={control} setValue={setValue} errors={errors} isProforma={isProforma} isCreditNote={isCreditNote} />
      <TotalsSummarySection control={control} register={register} isProforma={isProforma} />
      <PaymentDetailsSection control={control} register={register} setValue={setValue} isProforma={isProforma} />
      <TermsSignatureSection control={control} register={register} errors={errors} />

      {/* Status selector */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-slate-500">Save as:</span>
        <Button
          type="button"
          variant="secondary"
          loading={isSaving}
          onClick={triggerDraftSave}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isSaving}
          onClick={() => {
            setValue("status", "FINAL");
            handleSubmit(async (v) => {
              const result = await onSave(v, "FINAL");
              if (result.success && typeof window !== "undefined") {
                window.sessionStorage.removeItem(INVOICE_WIP_SESSION_KEY);
              }
            }, handleValidationError)();
          }}
        >
          Save as Final
        </Button>
      </div>
      {isNewDocument && hasRecoverableDraft && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          You can also resume from <Link href="/drafts" className="underline underline-offset-2">Drafts</Link> if the form was already saved there.
        </p>
      )}
    </form>
  );
}
