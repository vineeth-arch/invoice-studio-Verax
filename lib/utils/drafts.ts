import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

export const DRAFTS_STORAGE_EVENT = "di-documents-updated";
export const INVOICE_WIP_SESSION_KEY = "di_invoice_wip";
export const PO_WIP_SESSION_KEY = "di_po_wip";

type DraftCounts = {
  invoices: number;
  purchaseOrders: number;
  total: number;
};

type DraftStoragePayload = {
  status?: string;
};

function safeParseArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countDrafts(items: DraftStoragePayload[]): number {
  return items.filter((item) => item?.status === "DRAFT").length;
}

export function getDraftCounts(): DraftCounts {
  const invoices = countDrafts(safeParseArray<Invoice>("di_invoices"));
  const purchaseOrders = countDrafts(safeParseArray<PurchaseOrder>("di_purchase_orders"));

  return {
    invoices,
    purchaseOrders,
    total: invoices + purchaseOrders,
  };
}

export function emitDraftsChangedEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DRAFTS_STORAGE_EVENT));
}

export function hasNonEmptyValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}
