"use client";

import { useEffect, useRef, useState } from "react";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { ToastProvider } from "@/components/ui/Toast";
import { invoicesRepository } from "@/lib/repositories/invoicesRepository";
import type { Invoice } from "@/lib/types/invoice";

interface SharedInvoicePageProps {
  shareToken: string;
}

export function SharedInvoicePage({ shareToken }: SharedInvoicePageProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const loadInvoice = async () => {
      const result = await invoicesRepository.getByShareToken(shareToken);
      if (!active) return;
      setInvoice(result.success ? (result.data ?? null) : null);
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
          {invoice === undefined ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
              Loading invoice...
            </div>
          ) : invoice === null ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <h1 className="text-xl font-semibold text-slate-900">Invoice not found</h1>
              <p className="mt-2 text-sm text-slate-500">This shared invoice link is invalid, revoked, or unavailable on this browser.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <PDFExportButton
                  previewRef={previewRef}
                  filename={`INV-${invoice.invoiceNumber ?? "shared"}-${invoice.buyer?.name ?? "client"}`}
                />
              </div>

              <A4PreviewWrapper ref={previewRef} noPadding>
                <InvoicePreview invoice={invoice} />
              </A4PreviewWrapper>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
