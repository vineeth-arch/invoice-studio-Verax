import type { Invoice } from "@/lib/types/invoice";

export function getCreditNotesTotal(invoice: Partial<Invoice>): number {
  return (invoice.creditNoteRefs ?? []).reduce((sum, ref) => sum + (ref.creditAmount || 0), 0);
}

export function getEffectiveOutstanding(invoice: Partial<Invoice>): number {
  return (invoice.totals?.grandTotal ?? 0) - getCreditNotesTotal(invoice) - (invoice.paymentReceivedAmount ?? 0);
}
