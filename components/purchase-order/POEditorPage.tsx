"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { POForm } from "./POForm";
import { POPreview } from "./POPreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import { saveInvoiceConversionDraft } from "@/lib/storage/local";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { calculatePOLineItem, calculatePOTotals } from "@/lib/utils/calculations";
import { v4 as uuidv4 } from "uuid";

interface POEditorPageProps {
  poId?: string;
}

const SPLIT_RATIO_KEY = "po_split_ratio";
const DEFAULT_SPLIT_RATIO = 0.5;
const MIN_FORM_WIDTH = 380;
const MIN_PREVIEW_WIDTH = 320;

export function POEditorPage({ poId }: POEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const [previewPO, setPreviewPO] = useState<Partial<PurchaseOrder>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isDesktop, setIsDesktop] = useState(false);
  const [workingPoId, setWorkingPoId] = useState<string | undefined>(poId);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saved">("idle");

  const { invoices } = useInvoices();
  const { purchaseOrders, loading: purchaseOrdersLoading, savePurchaseOrder, getPurchaseOrder } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingPO = poId
    ? getPurchaseOrder(poId)
    : workingPoId
      ? getPurchaseOrder(workingPoId)
      : undefined;
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
    if (poId) {
      setWorkingPoId(poId);
    }
  }, [poId]);

  useEffect(() => {
    if (autoSaveState !== "saved" || typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      setAutoSaveState("idle");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [autoSaveState]);

  const handleSave = useCallback(async (
    values: POFormValues,
    status: "DRAFT" | "FINAL",
    options?: { silent?: boolean; stayOnPage?: boolean }
  ) => {
    setIsSaving(true);
    const draftId = existingPO?.id ?? workingPoId ?? poId ?? uuidv4();
    const isFirstPersistedSave = !existingPO && !workingPoId && !poId;
    try {
      const items = values.lineItems.map((item) =>
        calculatePOLineItem({ ...item, quantity: Number(item.quantity), rate: Number(item.rate), discountPercent: Number(item.discountPercent), gstRate: Number(item.gstRate) })
      );
      const totals = calculatePOTotals(items, Number(values.otherCharges) || 0);
      const po = {
        ...(values as unknown as Partial<PurchaseOrder>),
        id: draftId,
        lineItems: items,
        totals,
        otherCharges: Number(values.otherCharges) || 0,
        status,
      } as Partial<PurchaseOrder>;
      setPreviewPO((current) => ({ ...current, ...po, status }));
      const result = await savePurchaseOrder(po);
      if (result.error) {
        console.error("[POEditorPage] savePurchaseOrder warning", result.error);
      }
      if (result.success) {
        const savedPoId = result.id ?? po.id;
        setWorkingPoId(savedPoId);
        if (isFirstPersistedSave) await documentNumberingRepository.incrementPOSequence();
        if (!options?.silent) {
          addToast(`Purchase order ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        }
        if (!options?.stayOnPage && savedPoId && !poId) router.push(`/purchase-order/${savedPoId}/edit`);
        return { success: true, id: savedPoId };
      } else {
        console.error("[POEditorPage] savePurchaseOrder failed", result.error);
        if (!options?.silent) {
          addToast(result.error ?? "Failed to save purchase order.", "error");
        }
      }
    } catch (error) {
      console.error("[POEditorPage] Unexpected save error", error);
      if (!options?.silent) {
        addToast("Failed to save purchase order.", "error");
      }
    } finally { setIsSaving(false); }
    return { success: false };
  }, [existingPO, workingPoId, poId, savePurchaseOrder, addToast, router]);

  const handleConvertToInvoice = useCallback(() => {
    if (!existingPO) return;
    const invoiceDraft: Partial<Invoice> = {
      invoiceType: "TAX_INVOICE",
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "DRAFT",
      paymentStatus: "Unpaid",
      poReference: existingPO.poNumber,
      projectDescription: existingPO.projectDescription,
      notes: existingPO.commercialTerms?.notes,
      buyer: {
        name: existingPO.vendor.name,
        billingAddress: { ...existingPO.vendor.address, country: existingPO.vendor.address.country ?? "India" },
        gstin: existingPO.vendor.gstin,
        contact: { email: existingPO.vendor.contact?.email ?? "", phone: existingPO.vendor.contact?.phone ?? "" },
        placeOfSupply: existingPO.delivery.address.state || existingPO.vendor.address.state,
        placeOfSupplyCode: existingPO.delivery.address.stateCode || existingPO.vendor.address.stateCode,
      },
      lineItems: existingPO.lineItems.map((item) => ({
        id: item.id, description: item.description, hsnSac: item.hsnSac ?? "",
        quantity: item.quantity, unit: item.unit, rate: item.rate, discountPercent: item.discountPercent,
        gstRate: item.gstRate, gross: 0, discountAmount: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, lineTotal: 0,
      })),
    };
    const draftResult = saveInvoiceConversionDraft(invoiceDraft);
    if (!draftResult.success) { addToast(draftResult.error ?? "Failed to prepare invoice draft.", "error"); return; }
    setIsConvertModalOpen(true);
  }, [addToast, existingPO]);

  const finalizeConversion = useCallback(async (nextStatus: PurchaseOrder["poStatus"]) => {
    if (!existingPO) return;
    setIsConverting(true);
    try {
      const result = await savePurchaseOrder({ ...existingPO, poStatus: nextStatus });
      if (!result.success) {
        addToast(result.error ?? "Failed to update PO status.", "error");
        return;
      }
      setIsConvertModalOpen(false);
      router.push("/invoice/new");
    } finally {
      setIsConverting(false);
    }
  }, [addToast, existingPO, router, savePurchaseOrder]);

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

  const pdfFilename = `PO-${previewPO.poNumber ?? "draft"}-${previewPO.vendor?.name ?? "vendor"}`;
  const isEditingRoute = Boolean(poId);

  if (poId && purchaseOrdersLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading purchase order…
      </div>
    );
  }
  if (poId && !existingPO) {
    return (
      <div className="flex h-screen items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Purchase order not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ── Editor top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0 no-print"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="font-display font-bold text-[18px] leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEditingRoute && existingPO ? `Edit PO — ${existingPO.poNumber}` : "New Purchase Order"}
            </h1>
            {autoSaveState === "saved" && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Draft saved
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fill the form on the left · preview on the right
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditingRoute && existingPO && (
            <Button variant="outline" onClick={handleConvertToInvoice}>
              Convert to Invoice
            </Button>
          )}
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} onGeneratingChange={setIsGeneratingPDF} />
          <PrintButton contentRef={previewRef} />
        </div>
      </div>

      {/* ── Mobile tab switcher ── */}
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
            <POForm
              initialValues={existingPO ?? undefined}
              settings={settings}
              companyProfile={profile}
              existingDocs={allDocs}
              onSave={handleSave}
              isSaving={isSaving}
              onPreviewChange={setPreviewPO}
              isNewDocument={!poId}
              onAutoSaveStateChange={setAutoSaveState}
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
          <div
            className="h-14 w-1 rounded-full bg-slate-300"
          />
        </div>

        <div
          className={`${activeTab === "form" ? "hidden" : "flex"} w-full flex-col overflow-y-auto bg-gray-200 p-4 lg:flex lg:min-w-[320px]`}
          style={isDesktop ? { flexBasis: `${(1 - splitRatio) * 100}%` } : undefined}
        >
          <A4PreviewWrapper ref={previewRef} noPadding>
            <POPreview po={previewPO} isGeneratingPDF={isGeneratingPDF} />
          </A4PreviewWrapper>
        </div>
      </div>

      <Modal
        open={isConvertModalOpen}
        onClose={() => !isConverting && setIsConvertModalOpen(false)}
        title="Mark this PO as Processed?"
        actions={(
          <>
            <Button
              variant="outline"
              onClick={() => void finalizeConversion("Approved")}
              loading={isConverting}
            >
              No, keep as Approved
            </Button>
            <Button
              onClick={() => void finalizeConversion("Processed")}
              loading={isConverting}
            >
              Yes, mark Processed
            </Button>
          </>
        )}
      >
        <p>We&apos;ll open a new invoice with the buyer details, line items, PO reference, project description, and notes pre-filled.</p>
      </Modal>
    </div>
  );
}
