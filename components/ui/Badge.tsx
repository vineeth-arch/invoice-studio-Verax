import { cn } from "@/lib/utils/cn";
import type { DocumentStatus, PaymentStatus, POStatus } from "@/lib/types/common";

const statusStyles: Record<DocumentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  FINAL: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  FINAL: "Final",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

interface BadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "error";
  className?: string;
}

const genericStyles = {
  default: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-800",
  success: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export function Badge({ children, variant = "default", className }: GenericBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        genericStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const paymentStatusStyles: Record<PaymentStatus, string> = {
  Unpaid: "bg-yellow-100 text-yellow-800",
  Partial: "bg-blue-100 text-blue-800",
  Paid: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-800",
};

const poStatusStyles: Record<POStatus, string> = {
  "Under Approval": "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Processed: "bg-green-100 text-green-800",
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", paymentStatusStyles[status], className)}>
      {status}
    </span>
  );
}

export function POStatusBadge({ status, className }: { status: POStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", poStatusStyles[status], className)}>
      {status}
    </span>
  );
}
