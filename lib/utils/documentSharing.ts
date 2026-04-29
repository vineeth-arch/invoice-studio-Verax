import { formatCurrencyINR } from "@/lib/utils/formatting";
import { getDisplayInvoiceNumber } from "@/lib/utils/invoiceTypes";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

type ShareableDocument =
  | { type: "invoice"; document: Partial<Invoice> }
  | { type: "po"; document: Partial<PurchaseOrder> };

function compactCurrency(amount: number) {
  const formatted = formatCurrencyINR(amount);
  return formatted.replace(".00", "");
}

export function buildShareUrl(origin: string, shareToken: string) {
  return `${origin}/share/${shareToken}`;
}

export function buildWhatsappUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildWhatsappMessage(doc: ShareableDocument, companyName: string, shareUrl: string) {
  if (doc.type === "invoice") {
    const invoiceNumber = getDisplayInvoiceNumber(doc.document);
    const grandTotal = doc.document.totals?.grandTotal ?? 0;
    return `Hi, please find attached the invoice ${invoiceNumber} for ${compactCurrency(grandTotal)} from ${companyName}. You can view and download it here: ${shareUrl}`;
  }

  const poNumber = doc.document.poNumber ?? "";
  const grandTotal = doc.document.totals?.grandTotal ?? 0;
  return `Hi, please find attached the purchase order ${poNumber} for ${compactCurrency(grandTotal)} from ${companyName}. You can view and download it here: ${shareUrl}`;
}
