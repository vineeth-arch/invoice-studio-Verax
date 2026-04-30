import type { Invoice } from "@/lib/types/invoice";
import { getBasePendingAmount, getGstPendingFromClient } from "./invoiceClearance";

export function getCreditNotesTotal(invoice: Partial<Invoice>): number {
  return (invoice.creditNoteRefs ?? []).reduce((sum, ref) => sum + (ref.creditAmount || 0), 0);
}

export function getEffectiveOutstanding(invoice: Partial<Invoice>): number {
  return Math.max(getBasePendingAmount(invoice) + getGstPendingFromClient(invoice) - getCreditNotesTotal(invoice), 0);
}
