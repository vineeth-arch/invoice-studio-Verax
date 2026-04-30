"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { SendEmailModal } from "@/components/document/SendEmailModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import { clearInvoiceConversionDraft, getInvoiceConversionDraft, saveInvoiceConversionDraft } from "@/lib/storage/local";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { Invoice } from "@/lib/types/invoice";
import type { GSTMode } from "@/lib/types/common";
import { calculateLineItem, calculateInvoiceTotals } from "@/lib/utils/calculations";
import { buildShareUrl, buildWhatsappMessage, buildWhatsappUrl } from "@/lib/utils/documentSharing";
import { Mail } from "lucide-react";
import { DOCUMENT_TYPE_FROM_INVOICE_TYPE, getDisplayInvoiceNumber, isProformaInvoice, resolveInvoiceType } from "@/lib/utils/invoiceTypes";

interface InvoiceEditorPageProps {
  invoiceId?: string;
}

const SPLIT_RATIO_KEY = "invoice_split_ratio";
const DEFAULT_SPLIT_RATIO = 0.5;
const MIN_FORM_WIDTH = 380;
const MIN_PREVIEW_WIDTH = 320;

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [conversionDraft, setConversionDraft] = useState<Partial<Invoice> | null>(null);
  const [draftReady, setDraftReady] = useState(Boolean(invoiceId));
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareActionLoading, setIsShareActionLoading] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isDesktop, setIsDesktop] = useState(false);
  const [workingInvoiceId, setWorkingInvoiceId] = useState<string | undefined>(invoiceId);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saved">("idle");

  const { invoices, loading: invoicesLoading, saveInvoice, getInvoice } = useInvoices();
  const { purchaseOrders } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingInvoice = invoiceId
    ? getInvoice(invoiceId)
    : workingInvoiceId
      ? getInvoice(workingInvoiceId)
      : undefined;
  const initialInvoice = existingInvoice ?? conversionDraft ?? undefined;
  const allDocs = [...invoices, ...purchaseOrders];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches);
    updateDesktopState();

    const storedRatio = Number(window.localStorage.getItem(SPLIT_RATIO_KEY));
    if (!Number.isNaN(storedRatio) && storedRatio > 0 && storedRatio < 1) {
      setSplitRatio(storedRatio);
    }

    mediaQuery.addEventListener("change", updateDesktopState);
    return () => mediaQuery.removeEventListener("change", updateDesktopState);
  }, []);

  useEffect(() => {
    if (invoiceId || typeof window === "undefined") {
      setDraftReady(true);
      return;
    }

    const draft = getInvoiceConversionDraft();
    setConversionDraft(draft);
    clearInvoiceConversionDraft();
    setDraftReady(true);
  }, [invoiceId]);

  useEffect(() => {
    setShareToken(existingInvoice?.shareToken ?? "");
  }, [existingInvoice?.shareToken]);

  useEffect(() => {
    if (typeof window === "undefined" || !existingInvoice?.shareToken) {
      setShareUrl("");
      return;
    }

    setShareUrl(buildShareUrl(window.location.origin, existingInvoice.shareToken));
  }, [existingInvoice?.shareToken]);

  useEffect(() => {
    if (invoiceId) {
      setWorkingInvoiceId(invoiceId);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (autoSaveState !== "saved" || typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      setAutoSaveState("idle");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [autoSaveState]);

  const handleSave = useCallback(async (
    values: InvoiceFormValues,
    status: "DRAFT" | "FINAL",
    options?: { silent?: boolean; stayOnPage?: boolean }
  ) => {
    setIsSaving(true);
    const draftId = existingInvoice?.id ?? workingInvoiceId ?? invoiceId ?? uuidv4();
    const isFirstPersistedSave = !existingInvoice && !workingInvoiceId && !invoiceId;
    try {
      const items = values.lineItems.map((item) =>
        calculateLineItem(
          { ...item, quantity: Number(item.quantity), rate: Number(item.rate), discountPercent: Number(item.discountPercent), gstRate: Number(item.gstRate) },
          values.gstMode as GSTMode
        )
      );
      const totals = calculateInvoiceTotals(items, Number(values.cess) || 0, Number(values.otherCharges) || 0);
      const isProforma = values.invoiceType === "PROFORMA";

      const invoice = {
        ...existingInvoice,
        ...(values as unknown as Partial<Invoice>),
        id: draftId,
        documentType: DOCUMENT_TYPE_FROM_INVOICE_TYPE[values.invoiceType],
        invoiceType: values.invoiceType,
        lineItems: items,
        totals,
        cess: isProforma ? 0 : Number(values.cess) || 0,
        otherCharges: Number(values.otherCharges) || 0,
        gstMode: isProforma ? "NO_TAX" : values.gstMode,
        reverseCharge: isProforma ? false : values.reverseCharge,
        ewayBillNumber: isProforma ? undefined : values.ewayBillNumber,
        irnNumber: isProforma ? undefined : values.irnNumber,
        irnQrImageBase64: isProforma ? undefined : values.irnQrImageBase64,
        status,
        shareToken: existingInvoice?.shareToken,
      } as Partial<Invoice>;

      setPreviewInvoice((current) => ({ ...current, ...invoice, status }));

      const result = await saveInvoice(invoice);
      if (result.error) {
        console.error("[InvoiceEditorPage] saveInvoice warning", result.error);
      }
      if (result.success) {
        const savedInvoiceId = result.id ?? invoice.id;
        const savedInvoice = { ...invoice, id: savedInvoiceId } as Invoice;
        setWorkingInvoiceId(savedInvoiceId);

        if (status === "FINAL" && values.invoiceType === "CREDIT_NOTE" && values.linkedInvoiceId && savedInvoiceId) {
          const creditAmount = Math.abs(savedInvoice.totals?.grandTotal ?? 0);

          await Promise.all(
            invoices
              .filter((candidate) => (candidate.creditNoteRefs ?? []).some((ref) => ref.creditNoteId === savedInvoiceId))
              .map((candidate) => saveInvoice({
                ...candidate,
                creditNoteRefs: (candidate.creditNoteRefs ?? []).filter((ref) => ref.creditNoteId !== savedInvoiceId),
              }))
          );

          const linkedInvoice = invoices.find((candidate) => candidate.id === values.linkedInvoiceId);
          if (linkedInvoice) {
            const nextRefs = [
              ...(linkedInvoice.creditNoteRefs ?? []).filter((ref) => ref.creditNoteId !== savedInvoiceId),
              {
                creditNoteId: savedInvoiceId,
                creditNoteNumber: savedInvoice.invoiceNumber,
                creditNoteDate: savedInvoice.invoiceDate,
                creditAmount,
              },
            ];

            await saveInvoice({
              ...linkedInvoice,
              creditNoteRefs: nextRefs,
            });
          }
        }

        if (isFirstPersistedSave) {
          await documentNumberingRepository.incrementInvoiceSequence();
        }
        if (!options?.silent) {
          addToast(`Invoice ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        }
        if (!options?.stayOnPage && savedInvoiceId && !invoiceId) {
          router.push(`/invoice/${savedInvoiceId}/edit`);
        }
        return { success: true, id: savedInvoiceId };
      } else {
        console.error("[InvoiceEditorPage] saveInvoice failed", result.error);
        if (!options?.silent) {
          addToast(result.error ?? "Failed to save invoice.", "error");
        }
      }
    } catch (error) {
      console.error("[InvoiceEditorPage] Unexpected save error", error);
      if (!options?.silent) {
        addToast("Failed to save invoice.", "error");
      }
    } finally {
      setIsSaving(false);
    }
    return { success: false };
  }, [existingInvoice, workingInvoiceId, invoiceId, saveInvoice, addToast, router, invoices]);

  const copyToClipboard = useCallback(async (url: string) => {
    if (typeof window === "undefined") return false;

    try {
      await window.navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const ensureShareLink = useCallback(async () => {
    if (!existingInvoice || typeof window === "undefined") return null;

    let token = existingInvoice.shareToken || shareToken;
    if (!token) {
      token = uuidv4();
      const result = await saveInvoice({ ...existingInvoice, shareToken: token });
      if (!result.success) {
        addToast(result.error ?? "Failed to create share link.", "error");
        return null;
      }
    }

    const url = buildShareUrl(window.location.origin, token);
    setShareToken(token);
    setShareUrl(url);
    return { token, url };
  }, [addToast, existingInvoice, saveInvoice, shareToken]);

  const handleShare = useCallback(async () => {
    if (!existingInvoice) return;

    setIsShareActionLoading(true);
    try {
      const shareLink = await ensureShareLink();
      if (!shareLink) return;
      setIsShareModalOpen(true);

      const copied = await copyToClipboard(shareLink.url);
      addToast(copied ? "Link copied" : "Share link ready to copy.", copied ? "success" : "info");
    } finally {
      setIsShareActionLoading(false);
    }
  }, [addToast, copyToClipboard, ensureShareLink, existingInvoice]);

  const handleWhatsappShare = useCallback(async () => {
    if (!existingInvoice || typeof window === "undefined") return;

    setIsShareActionLoading(true);
    try {
      const shareLink = await ensureShareLink();
      if (!shareLink) return;

      const message = buildWhatsappMessage(
        { type: "invoice", document: existingInvoice },
        profile?.companyName ?? existingInvoice.supplier?.name ?? "your company",
        shareLink.url
      );
      window.open(buildWhatsappUrl(message), "_blank", "noopener,noreferrer");
    } finally {
      setIsShareActionLoading(false);
    }
  }, [ensureShareLink, existingInvoice, profile?.companyName]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    const copied = await copyToClipboard(shareUrl);
    addToast(copied ? "Link copied" : "Copy failed. Please copy the link manually.", copied ? "success" : "error");
  }, [addToast, copyToClipboard, shareUrl]);

  const handleRevokeShareLink = useCallback(async () => {
    if (!existingInvoice || !shareToken) return;

    setIsShareActionLoading(true);
    try {
      const result = await saveInvoice({ ...existingInvoice, shareToken: undefined });
      if (!result.success) {
        addToast(result.error ?? "Failed to revoke share link.", "error");
        return;
      }

      setShareToken("");
      setShareUrl("");
      setIsShareModalOpen(false);
      addToast("Share link revoked.", "success");
    } finally {
      setIsShareActionLoading(false);
    }
  }, [addToast, existingInvoice, saveInvoice, shareToken]);

  const handleConvertToTaxInvoice = useCallback(() => {
    if (!existingInvoice) return;

    const proformaRef = getDisplayInvoiceNumber(existingInvoice);
    const nextNotes = [existingInvoice.notes, `Proforma Ref: ${proformaRef}`].filter(Boolean).join("\n");
    const draft: Partial<Invoice> = {
      ...existingInvoice,
      id: undefined,
      shareToken: undefined,
      status: "DRAFT",
      documentType: "tax_invoice",
      invoiceType: resolveInvoiceType({ documentType: "tax_invoice" }),
      invoiceDate: new Date().toISOString().slice(0, 10),
      notes: nextNotes,
    };

    const result = saveInvoiceConversionDraft(draft);
    if (!result.success) {
      addToast(result.error ?? "Failed to prepare tax invoice draft.", "error");
      return;
    }

    router.push("/invoice/new");
  }, [addToast, existingInvoice, router]);

  const startSplitDrag = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;

    const container = splitPaneRef.current;
    if (!container) return;

    event.preventDefault();

    const { left, width } = container.getBoundingClientRect();
    const minRatio = MIN_FORM_WIDTH / width;
    const maxRatio = (width - MIN_PREVIEW_WIDTH) / width;
    let currentRatio = splitRatio;

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = moveEvent.clientX - left;
      const nextRatio = Math.min(maxRatio, Math.max(minRatio, nextWidth / width));
      currentRatio = nextRatio;
      setSplitRatio(nextRatio);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.localStorage.setItem(SPLIT_RATIO_KEY, String(currentRatio));
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [isDesktop, splitRatio]);

  const pdfFilename = `INV-${previewInvoice.invoiceNumber ?? "draft"}-${previewInvoice.buyer?.name ?? "client"}`;
  const isEditingRoute = Boolean(invoiceId);
  const canShare = isEditingRoute && existingInvoice?.status === "FINAL";
  const canConvertToTaxInvoice = isEditingRoute && existingInvoice ? isProformaInvoice(existingInvoice) : false;

  if (!draftReady || (invoiceId && invoicesLoading)) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-500">Loading invoice editor...</div>;
  }

  if (invoiceId && !existingInvoice) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-500">Invoice not found.</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 no-print">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              {isEditingRoute && existingInvoice ? `Edit Invoice: ${getDisplayInvoiceNumber(existingInvoice)}` : "New Invoice"}
            </h1>
            {autoSaveState === "saved" && (
              <span className="text-xs text-slate-500 transition-opacity duration-300">
                Draft saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Fill the form on the left, preview on the right</p>
        </div>
        <div className="flex items-center gap-2">
          {canConvertToTaxInvoice && (
            <Button variant="outline" onClick={handleConvertToTaxInvoice}>
              Convert to Tax Invoice
            </Button>
          )}
          {canShare && (
            <Button variant="outline" onClick={handleShare} loading={isShareActionLoading}>
              Share
            </Button>
          )}
          {existingInvoice && (
            <Button variant="outline" onClick={() => setIsSendEmailModalOpen(true)}>
              <Mail className="h-4 w-4" />
              Email
            </Button>
          )}
          {canShare && (
            <Button
              type="button"
              onClick={handleWhatsappShare}
              loading={isShareActionLoading}
              className="border-[#25D366] bg-[#25D366] text-white hover:border-[#1ebe5d] hover:bg-[#1ebe5d]"
            >
              {!isShareActionLoading && <WhatsAppIcon />}
              Share on WhatsApp
            </Button>
          )}
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} onGeneratingChange={setIsGeneratingPDF} />
          <PrintButton contentRef={previewRef} />
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white no-print lg:hidden">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "form" ? "border-b-2 border-brand-500 text-brand-600" : "text-slate-500"}`}
        >
          Form
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "preview" ? "border-b-2 border-brand-500 text-brand-600" : "text-slate-500"}`}
        >
          Preview
        </button>
      </div>

      <div ref={splitPaneRef} className="flex flex-1 overflow-hidden">
        <div
          className={`${activeTab === "preview" ? "hidden" : "flex"} w-full flex-col overflow-y-auto bg-slate-50 no-print lg:flex lg:min-w-[380px]`}
          style={isDesktop ? { flexBasis: `${splitRatio * 100}%` } : undefined}
        >
          <div className="space-y-3 p-4">
            <InvoiceForm
              initialValues={initialInvoice}
              settings={settings}
              companyProfile={profile}
              existingDocs={allDocs}
              onSave={handleSave}
              isSaving={isSaving}
              onPreviewChange={setPreviewInvoice}
              isNewDocument={!invoiceId}
              onAutoSaveStateChange={setAutoSaveState}
              conversionSourcePoReference={!invoiceId ? conversionDraft?.poReference : undefined}
            />
          </div>
        </div>

        <div
          className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 transition-colors hover:bg-slate-200 no-print lg:flex"
          onMouseDown={startSplitDrag}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize form and preview panels"
        >
          <div className="h-14 w-1 rounded-full bg-slate-300" />
        </div>

        <div
          className={`${activeTab === "form" ? "hidden" : "flex"} w-full flex-col overflow-y-auto bg-gray-200 p-4 lg:flex lg:min-w-[320px]`}
          style={isDesktop ? { flexBasis: `${(1 - splitRatio) * 100}%` } : undefined}
        >
          <A4PreviewWrapper ref={previewRef} noPadding>
            <InvoicePreview invoice={previewInvoice} isGeneratingPDF={isGeneratingPDF} />
          </A4PreviewWrapper>
        </div>
      </div>

      <Modal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Invoice sharing"
        actions={(
          <>
            {shareToken && (
              <Button variant="destructive" onClick={handleRevokeShareLink} loading={isShareActionLoading}>
                Revoke share link
              </Button>
            )}
            <Button variant="outline" onClick={handleCopyShareLink}>
              Copy link
            </Button>
            <Button onClick={() => setIsShareModalOpen(false)}>
              Close
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Local storage mode: this share link works only on this same browser and device until Supabase-backed sharing is connected.
          </p>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Share URL</div>
            <div className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {shareUrl || "Share link will appear here."}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Invoice settings: revoking the link clears the share token and immediately invalidates the current URL.
          </p>
        </div>
      </Modal>

      {existingInvoice && (
        <SendEmailModal
          open={isSendEmailModalOpen}
          onClose={() => setIsSendEmailModalOpen(false)}
          documentType={isProformaInvoice(existingInvoice) ? "proforma" : "invoice"}
          invoiceNumber={getDisplayInvoiceNumber(existingInvoice)}
          clientName={existingInvoice.buyer?.name ?? ""}
          clientEmail={existingInvoice.buyer?.contact?.email}
          amount={existingInvoice.totals?.grandTotal?.toLocaleString("en-IN") ?? "0"}
          dueDate={existingInvoice.dueDate}
          senderName={existingInvoice.supplier?.name ?? ""}
          senderEmail={existingInvoice.supplier?.contact?.email ?? ""}
          shareUrl={shareUrl || undefined}
          previewRef={previewRef}
          filename={pdfFilename}
        />
      )}
    </div>
  );
}
