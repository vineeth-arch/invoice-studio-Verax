import { cn } from "@/lib/utils/cn";

type StatusType = "paid" | "overdue" | "draft" | "amber";

interface StatusDotProps {
  status: StatusType;
  size?: number;
  className?: string;
}

export function StatusDot({ status, size = 9, className }: StatusDotProps) {
  return (
    <span
      className={cn("status-light inline-block shrink-0", className)}
      data-status={status}
      style={{ width: size, height: size }}
      aria-label={status}
      role="img"
    />
  );
}
