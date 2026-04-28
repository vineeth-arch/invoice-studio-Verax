"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { POForm } from "./POForm";
import { POPreview } from "./POPreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { calculatePOLineItem, calculatePOTotals } from "@/lib/utils/calculations";

interface POEditorPageProps {
  poId?: string;
}

export function POEditorPage({ poId }: POEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewPO, setPreviewPO] = useState<Partial<PurchaseOrder>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const { invoices } = useInvoices();
  const { purchaseOrders, savePurchaseOrder, getPurchaseOrder } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingPO = poId ? getPurchaseOrder(poId) : undefined;
  const allDocs = [...invoices, ...purchaseOrders];

  const handleSave = useCallback(async (values: POFormValues, status: "DRAFT" | "FINAL") => {
    setIsSaving(true);
    try {
      const items = values.lineItems.map((item) =>
        calculatePOLineItem({ ...item, quantity: Number(item.quantity), rate: Number(item.rate), discountPercent: Number(item.discountPercent), gstRate: Number(item.gstRate) })
      );
      const totals = calculatePOTotals(items, Number(values.otherCharges) || 0);

      const po = {
        ...(values as unknown as Partial<PurchaseOrder>),
        id: existingPO?.id ?? poId,
        lineItems: items,
        totals,
        otherCharges: Number(values.otherCharges) || 0,
        status,
      } as Partial<PurchaseOrder>;

      const result = await savePurchaseOrder(po);
      if (result.success) {
        if (!existingPO && !poId) {
          await documentNumberingRepository.incrementPOSequence();
        }
        addToast(`Purchase order ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        if (result.id && !poId) router.push(`/purchase-order/${result.id}/edit`);
      } else {
        addToast(result.error ?? "Failed to save purchase order.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [existingPO, poId, savePurchaseOrder, addToast, router]);

  const pdfFilename = `PO_${previewPO.poNumber ?? "draft"}_${previewPO.vendor?.name ?? "vendor"}`;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 no-print">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {existingPO ? `Edit PO: ${existingPO.poNumber}` : "New Purchase Order"}
          </h1>
          <p className="text-xs text-slate-500">Fill the form on the left, preview on the right</p>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} />
          <PrintButton contentRef={previewRef} />
        </div>
      </div>

      <div className="lg:hidden flex border-b border-slate-200 bg-white no-print">
        <button onClick={() => setActiveTab("form")} className={`flex-1 py-2 text-sm font-medium ${activeTab === "form" ? "text-brand-600 border-b-2 border-brand-500" : "text-slate-500"}`}>Form</button>
        <button onClick={() => setActiveTab("preview")} className={`flex-1 py-2 text-sm font-medium ${activeTab === "preview" ? "text-brand-600 border-b-2 border-brand-500" : "text-slate-500"}`}>Preview</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${activeTab === "preview" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto bg-slate-50 no-print`}>
          <div className="p-4 space-y-3">
            <POForm
              initialValues={existingPO ?? undefined}
              settings={settings}
              companyProfile={profile}
              existingDocs={allDocs}
              onSave={handleSave}
              isSaving={isSaving}
              onPreviewChange={setPreviewPO}
            />
          </div>
        </div>
        <div className={`${activeTab === "form" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto bg-gray-200 p-4`}>
          <A4PreviewWrapper ref={previewRef} noPadding>
            <POPreview po={previewPO} />
          </A4PreviewWrapper>
        </div>
      </div>
    </div>
  );
}
