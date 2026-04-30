import { cn } from "@/lib/utils/cn";
import styles from "./paper-doc.module.css";

type DocStatus = "paid" | "overdue" | "draft";

interface PaperDocProps {
  status?: DocStatus;
  showHoles?: boolean;
  stampText?: string;
  className?: string;
  children: React.ReactNode;
}

const statusLabel: Record<DocStatus, string> = {
  paid: "PAID",
  overdue: "OVERDUE",
  draft: "DRAFT",
};

export function PaperDoc({
  status,
  showHoles = false,
  stampText,
  className,
  children,
}: PaperDocProps) {
  const label = stampText ?? (status ? statusLabel[status] : undefined);

  return (
    <div className={cn(styles.doc, className)}>
      {/* Hole punches on left edge */}
      {showHoles && (
        <div className={styles.holes} aria-hidden="true">
          <span className={styles.holeMiddle} />
        </div>
      )}

      {/* Status stamp */}
      {status && label && (
        <div
          className={cn(styles.stamp, styles[`stamp--${status}`])}
          aria-label={`Status: ${label}`}
        >
          {label}
        </div>
      )}

      {/* Content above noise overlay */}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

/** Single ruled row divider — warm sepia line, like aged paper */
export function PaperRule({ className }: { className?: string }) {
  return <div className={cn(styles.ruled, className)} aria-hidden="true" />;
}
