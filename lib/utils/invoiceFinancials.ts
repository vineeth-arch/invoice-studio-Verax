import type { Invoice } from "@/lib/types/invoice";
import { getBasePendingAmount, getGstPendingAmount } from "./invoiceClearance";

export function getCreditNotesTotal(invoice: Partial<Invoice>): number {
  return (invoice.creditNoteRefs ?? []).reduce((sum, ref) => sum + (ref.creditAmount || 0), 0);
}

export function getEffectiveOutstanding(invoice: Partial<Invoice>): number {
  return Math.max(getBasePendingAmount(invoice) + getGstPendingAmount(invoice) - getCreditNotesTotal(invoice), 0);
}
