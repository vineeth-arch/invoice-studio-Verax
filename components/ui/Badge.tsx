import { cn } from "@/lib/utils/cn";
import type { DocumentStatus, PaymentStatus, POStatus } from "@/lib/types/common";

/* ── Document Status ── */
const statusStyles: Record<DocumentStatus, { bg: string; text: string }> = {
  DRAFT:     { bg: "var(--accent-yellow-muted)", text: "var(--accent-yellow-text)" },
  FINAL:     { bg: "var(--accent-purple-muted)", text: "var(--accent-purple-text)" },
  PAID:      { bg: "var(--accent-mint-muted)",   text: "var(--accent-mint-text)" },
  CANCELLED: { bg: "var(--accent-coral-muted)",  text: "var(--accent-coral-text)" },
};
const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Draft", FINAL: "Final", PAID: "Paid", CANCELLED: "Cancelled",
};

export function StatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold badge-transition", className)}
      style={{ background: s.bg, color: s.text }}
    >
      {statusLabels[status]}
    </span>
  );
}

/* ── Payment Status ── */
const paymentStyles: Record<PaymentStatus, { bg: string; text: string }> = {
  Unpaid:  { bg: "var(--accent-yellow-muted)", text: "var(--accent-yellow-text)" },
  Partial: { bg: "var(--accent-purple-muted)", text: "var(--accent-purple-text)" },
  Paid:    { bg: "var(--accent-mint-muted)",   text: "var(--accent-mint-text)" },
  Overdue: { bg: "var(--accent-coral-muted)",  text: "var(--accent-coral-text)" },
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const s = paymentStyles[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold badge-transition", className)}
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

/* ── PO Status ── */
const poStyles: Record<POStatus, { bg: string; text: string }> = {
  "Under Approval": { bg: "var(--accent-yellow-muted)", text: "var(--accent-yellow-text)" },
  Approved:         { bg: "var(--accent-mint-muted)",   text: "var(--accent-mint-text)" },
  Processed:        { bg: "var(--accent-purple-muted)", text: "var(--accent-purple-text)" },
};

export function POStatusBadge({ status, className }: { status: POStatus; className?: string }) {
  const s = poStyles[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold badge-transition", className)}
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

/* ── Generic Badge ── */
interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "error";
  className?: string;
}
const genericStyles = {
  default: { bg: "var(--surface-raised)", text: "var(--text-secondary)" },
  warning: { bg: "var(--accent-yellow-muted)", text: "var(--accent-yellow-text)" },
  success: { bg: "var(--accent-mint-muted)", text: "var(--accent-mint-text)" },
  error:   { bg: "var(--accent-coral-muted)", text: "var(--accent-coral-text)" },
};
export function Badge({ children, variant = "default", className }: GenericBadgeProps) {
  const s = genericStyles[variant];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", className)}
      style={{ background: s.bg, color: s.text }}
    >
      {children}
    </span>
  );
}
