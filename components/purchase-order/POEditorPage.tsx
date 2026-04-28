"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { Button } from "@/components/ui/Button";
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
  const { purchaseOrders, loading: purchaseOrdersLoading, savePurchaseOrder, getPurchaseOrder } = usePurchaseOrders();
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
        if (!existingPO && !poId) await documentNumberingRepository.incrementPOSequence();
        addToast(`Purchase order ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        if (result.id && !poId) router.push(`/purchase-order/${result.id}/edit`);
      } else {
        addToast(result.error ?? "Failed to save purchase order.", "error");
      }
    } finally { setIsSaving(false); }
  }, [existingPO, poId, savePurchaseOrder, addToast, router]);

  const handleConvertToInvoice = useCallback(async () => {
    if (!existingPO) return;
    const invoiceDraft: Partial<Invoice> = {
      invoiceType: "TAX_INVOICE",
      invoiceDate: new Date().toISOString().slice(0, 10),
      poReference: existingPO.poNumber,
      projectDescription: existingPO.projectDescription,
      buyer: {
        name: existingPO.buyer.name,
        billingAddress: { ...existingPO.buyer.address, country: existingPO.buyer.address.country ?? "India" },
        gstin: existingPO.buyer.gstin,
        contact: { email: existingPO.buyer.contact?.email ?? "", phone: existingPO.buyer.contact?.phone ?? "" },
        placeOfSupply: existingPO.buyer.address.state,
        placeOfSupplyCode: existingPO.buyer.stateCode || existingPO.buyer.address.stateCode,
      },
      lineItems: existingPO.lineItems.map((item) => ({
        id: item.id, description: item.description, hsnSac: item.hsnSac ?? "",
        quantity: item.quantity, unit: item.unit, rate: item.rate, discountPercent: item.discountPercent,
        gstRate: item.gstRate, gross: 0, discountAmount: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, lineTotal: 0,
      })),
    };
    const draftResult = saveInvoiceConversionDraft(invoiceDraft);
    if (!draftResult.success) { addToast(draftResult.error ?? "Failed to prepare invoice draft.", "error"); return; }
    const shouldMarkProcessed = window.confirm("Mark this PO as Processed?");
    if (shouldMarkProcessed && existingPO.poStatus !== "Processed") {
      const result = await savePurchaseOrder({ ...existingPO, poStatus: "Processed" });
      if (!result.success) { addToast(result.error ?? "Failed to update PO status.", "error"); return; }
    }
    router.push("/invoice/new");
  }, [addToast, existingPO, router, savePurchaseOrder]);

  const pdfFilename = `PO-${previewPO.poNumber ?? "draft"}-${previewPO.vendor?.name ?? "vendor"}`;

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
          <h1
            className="font-display font-bold text-[18px] leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {existingPO ? `Edit PO — ${existingPO.poNumber}` : "New Purchase Order"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fill the form on the left · preview on the right
          </p>
        </div>
        <div className="flex items-center gap-2">
          {existingPO && (
            <Button variant="outline" onClick={handleConvertToInvoice}>
              Convert to Invoice
            </Button>
          )}
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} />
          <PrintButton contentRef={previewRef} />
        </div>
      </div>

      {/* ── Mobile tab switcher ── */}
      <div
        className="lg:hidden flex shrink-0 no-print"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {(["form", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--accent-yellow)" : "var(--text-secondary)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-yellow)" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Split pane ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form panel */}
        <div
          className={`${activeTab === "preview" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto no-print`}
          style={{ background: "var(--bg)" }}
        >
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

        {/* Preview panel — always white, theme-immune */}
        <div
          className={`${activeTab === "form" ? "hidden" : "flex"} lg:flex w-full lg:w-1/2 flex-col overflow-y-auto p-5`}
          style={{ background: "#E8E8E4" }}
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
            style={{ maxWidth: 820, background: "#FFFFFF" }}
          >
            <A4PreviewWrapper ref={previewRef} noPadding>
              <div className="pdf-preview-surface">
                <POPreview po={previewPO} />
              </div>
            </A4PreviewWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}
