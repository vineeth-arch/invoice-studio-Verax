import type { Invoice } from "@/lib/types/invoice";

export type AgingBucket = "Current" | "0-30" | "31-60" | "61-90" | "90+";

function toDate(dateString?: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getInvoiceDueDate(invoice: Partial<Invoice>): Date | null {
  const explicitDueDate = toDate(invoice.dueDate);
  if (explicitDueDate) return explicitDueDate;

  const invoiceDate = toDate(invoice.invoiceDate);
  if (!invoiceDate) return null;

  const derivedDueDate = new Date(invoiceDate);
  derivedDueDate.setDate(derivedDueDate.getDate() + 30);
  return derivedDueDate;
}

export function getDaysOutstanding(invoice: Partial<Invoice>, today = new Date()): number {
  const dueDate = getInvoiceDueDate(invoice);
  if (!dueDate) return 0;

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.floor((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAgingBucket(daysOutstanding: number): AgingBucket {
  if (daysOutstanding <= 0) return "Current";
  if (daysOutstanding <= 30) return "0-30";
  if (daysOutstanding <= 60) return "31-60";
  if (daysOutstanding <= 90) return "61-90";
  return "90+";
}

export function withAutoOverdueStatus(invoice: Invoice, today = new Date()): Invoice {
  const daysOutstanding = getDaysOutstanding(invoice, today);
  if (daysOutstanding > 90 && invoice.paymentStatus === "Unpaid") {
    return { ...invoice, paymentStatus: "Overdue" };
  }
  return invoice;
}
