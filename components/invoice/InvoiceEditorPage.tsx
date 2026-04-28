"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSavedClients } from "@/lib/hooks/useSavedClients";
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

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const { invoices, saveInvoice, getInvoice } = useInvoices();
  const { purchaseOrders } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { saveBuyerFromInvoice } = useSavedClients();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingInvoice = invoiceId ? getInvoice(invoiceId) : undefined;
  const allDocs = [...invoices, ...purchaseOrders];

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
        await saveBuyerFromInvoice(values.buyer);
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
  }, [existingInvoice, invoiceId, saveInvoice, saveBuyerFromInvoice, addToast, router]);

  const pdfFilename = `Invoice_${previewInvoice.invoiceNumber ?? "draft"}_${previewInvoice.buyer?.name ?? "client"}`;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 no-print">
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

      {/* Mobile tab switcher */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white no-print">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "form" ? "text-brand-600 border-b-2 border-brand-500" : "text-slate-500"}`}
        >
          Form
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "preview" ? "text-brand-600 border-b-2 border-brand-500" : "text-slate-500"}`}
        >
          Preview
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form panel */}
        <div className={`${activeTab === "preview" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto bg-slate-50 no-print`}>
          <div className="p-4 space-y-3">
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

        {/* Preview panel */}
        <div className={`${activeTab === "form" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto bg-gray-200 p-4`}>
          <A4PreviewWrapper ref={previewRef} noPadding>
            <InvoicePreview invoice={previewInvoice} />
          </A4PreviewWrapper>
        </div>
      </div>
    </div>
  );
}
