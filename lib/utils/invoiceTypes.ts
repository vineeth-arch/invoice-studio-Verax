import type { DocumentType, Invoice, InvoiceType } from "@/lib/types/invoice";

export const DOCUMENT_TYPE_FROM_INVOICE_TYPE: Record<InvoiceType, DocumentType> = {
  PROFORMA: "proforma",
  TAX_INVOICE: "tax_invoice",
  BILL_OF_SUPPLY: "bill_of_supply",
  EXPORT_INVOICE: "export_invoice",
  CREDIT_NOTE: "credit_note",
  DEBIT_NOTE: "debit_note",
};

export const INVOICE_TYPE_FROM_DOCUMENT_TYPE: Record<DocumentType, InvoiceType> = {
  proforma: "PROFORMA",
  tax_invoice: "TAX_INVOICE",
  bill_of_supply: "BILL_OF_SUPPLY",
  export_invoice: "EXPORT_INVOICE",
  credit_note: "CREDIT_NOTE",
  debit_note: "DEBIT_NOTE",
};

export function resolveDocumentType(invoice: Partial<Pick<Invoice, "documentType" | "invoiceType">>): DocumentType {
  if (invoice.documentType) return invoice.documentType;
  if (invoice.invoiceType) return DOCUMENT_TYPE_FROM_INVOICE_TYPE[invoice.invoiceType];
  return "tax_invoice";
}

export function resolveInvoiceType(invoice: Partial<Pick<Invoice, "documentType" | "invoiceType">>): InvoiceType {
  if (invoice.invoiceType) return invoice.invoiceType;
  return INVOICE_TYPE_FROM_DOCUMENT_TYPE[resolveDocumentType(invoice)];
}

export function isProformaInvoice(invoice: Partial<Pick<Invoice, "documentType" | "invoiceType">>): boolean {
  return resolveDocumentType(invoice) === "proforma";
}

export function getDisplayInvoiceNumber(invoice: Partial<Pick<Invoice, "documentType" | "invoiceType" | "invoiceNumber">>): string {
  const invoiceNumber = invoice.invoiceNumber ?? "";
  if (!invoiceNumber) return "";
  if (!isProformaInvoice(invoice)) return invoiceNumber;
  return invoiceNumber.startsWith("PRO-") ? invoiceNumber : `PRO-${invoiceNumber}`;
}
