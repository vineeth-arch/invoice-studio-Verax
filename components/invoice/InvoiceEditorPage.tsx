"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { Invoice } from "@/lib/types/invoice";
import type { GSTMode } from "@/lib/types/common";
import { calculateLineItem, calculateInvoiceTotals } from "@/lib/utils/calculations";

interface InvoiceEditorPageProps {
  invoiceId?: string;
}

const SPLIT_RATIO_KEY = "di_split_ratio";
const DEFAULT_SPLIT_RATIO = 0.5;
const MIN_FORM_WIDTH = 380;
const MIN_PREVIEW_WIDTH = 320;

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isDesktop, setIsDesktop] = useState(false);

  const { invoices, saveInvoice, getInvoice } = useInvoices();
  const { purchaseOrders } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingInvoice = invoiceId ? getInvoice(invoiceId) : undefined;
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

  const handleSave = useCallback(async (values: InvoiceFormValues, status: "DRAFT" | "FINAL") => {
    setIsSaving(true);
    try {
      const items = values.lineItems.map((item) =>
        calculateLineItem(
          { ...item, quantity: Number(item.quantity), rate: Number(item.rate), discountPercent: Number(item.discountPercent), gstRate: Number(item.gstRate) },
          values.gstMode as GSTMode
        )
      );
      const totals = calculateInvoiceTotals(items, Number(values.cess) || 0, Number(values.otherCharges) || 0);

      const invoice = {
        ...(values as unknown as Partial<Invoice>),
        id: existingInvoice?.id ?? invoiceId,
        lineItems: items,
        totals,
        cess: Number(values.cess) || 0,
        otherCharges: Number(values.otherCharges) || 0,
        status,
      } as Partial<Invoice>;

      const result = await saveInvoice(invoice);
      if (result.success) {
        if (!existingInvoice && !invoiceId) {
          await documentNumberingRepository.incrementInvoiceSequence();
        }
        addToast(`Invoice ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        if (result.id && !invoiceId) {
          router.push(`/invoice/${result.id}/edit`);
        }
      } else {
        addToast(result.error ?? "Failed to save invoice.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [existingInvoice, invoiceId, saveInvoice, addToast, router]);

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

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 no-print">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {existingInvoice ? `Edit Invoice: ${existingInvoice.invoiceNumber}` : "New Invoice"}
          </h1>
          <p className="text-xs text-slate-500">Fill the form on the left, preview on the right</p>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} />
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
              initialValues={existingInvoice ?? undefined}
              settings={settings}
              companyProfile={profile}
              existingDocs={allDocs}
              onSave={handleSave}
              isSaving={isSaving}
              onPreviewChange={setPreviewInvoice}
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
            <InvoicePreview invoice={previewInvoice} />
          </A4PreviewWrapper>
        </div>
      </div>
    </div>
  );
}
