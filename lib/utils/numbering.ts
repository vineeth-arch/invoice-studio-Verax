import type { NumberingConfig } from "@/lib/types/settings";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

export function getFinancialYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();
  // India FY: Apr 1 – Mar 31. FY 2025-26 → "26"
  return month >= 4 ? String(year).slice(-2) : String(year - 1).slice(-2);
}

export function generateDocumentNumber(config: NumberingConfig, fy: string): string {
  const seq = String(config.currentSequence).padStart(config.paddingLength, "0");
  const parts = [config.prefix];
  if (config.includeYear) parts.push(fy);
  parts.push(seq);
  return parts.join(config.separator);
}

export function generateInvoiceNumber(config: NumberingConfig, fy?: string): string {
  return generateDocumentNumber(config, fy ?? getFinancialYear());
}

export function generatePONumber(config: NumberingConfig, fy?: string): string {
  return generateDocumentNumber(config, fy ?? getFinancialYear());
}

export function checkDuplicateDocumentNumber(
  number: string,
  existing: Array<Invoice | PurchaseOrder>,
  currentId?: string
): boolean {
  return existing.some((doc) => {
    const docNum = "invoiceNumber" in doc ? doc.invoiceNumber : doc.poNumber;
    return docNum === number && doc.id !== currentId;
  });
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, "_").replace(/_+/g, "_").slice(0, 100);
}
