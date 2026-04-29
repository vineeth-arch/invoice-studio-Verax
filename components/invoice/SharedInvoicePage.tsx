"use client";

import { useEffect, useRef, useState } from "react";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { POPreview } from "@/components/purchase-order/POPreview";
import { ToastProvider } from "@/components/ui/Toast";
import { invoicesRepository } from "@/lib/repositories/invoicesRepository";
import { purchaseOrdersRepository } from "@/lib/repositories/purchaseOrdersRepository";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

interface SharedInvoicePageProps {
  shareToken: string;
}

export function SharedInvoicePage({ shareToken }: SharedInvoicePageProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState<
    { type: "invoice"; data: Invoice } | { type: "po"; data: PurchaseOrder } | null | undefined
  >(undefined);

  useEffect(() => {
    let active = true;

    const loadInvoice = async () => {
      const invoiceResult = await invoicesRepository.getByShareToken(shareToken);
      if (!active) return;
      if (invoiceResult.success && invoiceResult.data) {
        setDocument({ type: "invoice", data: invoiceResult.data });
        return;
      }

      const poResult = await purchaseOrdersRepository.getByShareToken(shareToken);
      if (!active) return;
      setDocument(poResult.success && poResult.data ? { type: "po", data: poResult.data } : null);
    };

    void loadInvoice();

    return () => {
      active = false;
    };
  }, [shareToken]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-5xl">
          {document === undefined ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
              Loading document...
            </div>
          ) : document === null ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <h1 className="text-xl font-semibold text-slate-900">Document not found</h1>
              <p className="mt-2 text-sm text-slate-500">This shared link is invalid, revoked, or unavailable on this browser.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <PDFExportButton
                  previewRef={previewRef}
                  filename={document.type === "invoice"
                    ? `INV-${document.data.invoiceNumber ?? "shared"}-${document.data.buyer?.name ?? "client"}`
                    : `PO-${document.data.poNumber ?? "shared"}-${document.data.vendor?.name ?? "vendor"}`}
                />
              </div>

              <A4PreviewWrapper ref={previewRef} noPadding>
                {document.type === "invoice" ? (
                  <InvoicePreview invoice={document.data} />
                ) : (
                  <POPreview po={document.data} />
                )}
              </A4PreviewWrapper>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
