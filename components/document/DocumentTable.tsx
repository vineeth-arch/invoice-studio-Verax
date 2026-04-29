"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Edit, Copy, Trash2, MoreVertical, ArrowRightLeft } from "lucide-react";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { DocumentStatus } from "@/lib/types/common";
import { Badge, PaymentStatusBadge, POStatusBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { getAgingBucket, getDaysOutstanding } from "@/lib/utils/aging";
import { getDisplayInvoiceNumber } from "@/lib/utils/invoiceTypes";

type DocEntry = {
  id: string;
  type: "invoice" | "po";
  number: string;
  partyName: string;
  date: string;
  amount: number;
  status: DocumentStatus;
  paymentStatus?: Invoice["paymentStatus"];
  poStatus?: PurchaseOrder["poStatus"];
  overdue90Plus?: boolean;
};

function toDocEntry(doc: Invoice | PurchaseOrder): DocEntry {
  if ("invoiceNumber" in doc) {
    return {
      id: doc.id, type: "invoice",
      number: getDisplayInvoiceNumber(doc), partyName: doc.buyer.name,
      date: doc.invoiceDate, amount: doc.totals.grandTotal,
      status: doc.status, paymentStatus: doc.paymentStatus,
      overdue90Plus: getAgingBucket(getDaysOutstanding(doc)) === "90+",
    };
  }
  return {
    id: doc.id, type: "po",
    number: doc.poNumber, partyName: doc.vendor.name,
    date: doc.poDate, amount: doc.totals.grandTotal,
    status: doc.status, poStatus: doc.poStatus,
  };
}

/* ── Three-dot context menu ── */
function DocMenu({
  editHref,
  onDuplicate,
  onDelete,
  onConvert,
  onShareWhatsApp,
}: {
  editHref: string;
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert?: () => void;
  onShareWhatsApp?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.preventDefault()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-theme-surface-raised"
        style={{ color: "var(--text-muted)" }}
        aria-label="Document actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-fade-in"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <Link
            href={editHref}
            className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setOpen(false)}
          >
            <Edit className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
            Edit
          </Link>
          <button
            onClick={() => { onDuplicate(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
            style={{ color: "var(--text-primary)" }}
          >
            <Copy className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
            Duplicate
          </button>
          {onConvert && (
            <button
              onClick={() => { onConvert(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
              style={{ color: "var(--text-primary)" }}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              Convert to Invoice
            </button>
          )}
          {onShareWhatsApp && (
            <button
              onClick={() => { onShareWhatsApp(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
              style={{ color: "var(--text-primary)" }}
            >
              <span style={{ color: "#25D366" }}>
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </span>
              Share via WhatsApp
            </button>
          )}
          <div style={{ borderTop: "1px solid var(--border)" }} className="my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
            style={{ color: "var(--accent-coral)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Individual document card ── */
function DocCard({
  doc,
  onDuplicate,
  onDelete,
  onConvert,
  onShareWhatsApp,
}: {
  doc: DocEntry;
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert: () => void;
  onShareWhatsApp: () => void;
}) {
  const editHref = `/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`;
  const isInvoice = doc.type === "invoice";
  const canConvert = !isInvoice && doc.status === "FINAL" && doc.poStatus === "Approved";
  const canShareWhatsApp = isInvoice ? doc.status === "FINAL" : doc.status === "FINAL" && doc.poStatus === "Approved";

  return (
    <div
      className="group relative rounded-card flex flex-col gap-4 p-5 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top row: type badge + menu */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full badge-transition"
          style={{
            background: isInvoice ? "var(--accent-yellow-muted)" : "var(--accent-purple-muted)",
            color: isInvoice ? "var(--accent-yellow-text)" : "var(--accent-purple-text)",
          }}
        >
          {isInvoice ? "Invoice" : "Purchase Order"}
        </span>
        <DocMenu
          editHref={editHref}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onConvert={canConvert ? onConvert : undefined}
          onShareWhatsApp={canShareWhatsApp ? onShareWhatsApp : undefined}
        />
      </div>

      {/* Doc number */}
      <Link href={editHref} className="block group-hover:opacity-80 transition-opacity">
        <p className="font-mono text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>
          {doc.number}
        </p>
        <h3 className="font-display font-bold text-[17px] mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>
          {doc.partyName}
        </h3>
      </Link>

      {/* Amount */}
      <div className="font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        {formatCurrencyINR(doc.amount)}
      </div>

      {/* Footer: date + status badges */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatDate(doc.date)}
        </span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <StatusBadge status={doc.status} />
          {isInvoice && doc.paymentStatus && (
            <PaymentStatusBadge status={doc.paymentStatus} />
          )}
          {isInvoice && doc.overdue90Plus && (
            <Badge variant="error">Overdue 90+</Badge>
          )}
          {!isInvoice && doc.poStatus && (
            <POStatusBadge status={doc.poStatus} />
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentTableProps {
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  onDelete: (id: string, type: "invoice" | "po") => void;
  onDuplicate: (id: string, type: "invoice" | "po") => void;
  onConvert: (id: string, type: "invoice" | "po") => void;
  onShareWhatsApp: (id: string, type: "invoice" | "po") => void;
}

export function DocumentTable({ invoices, purchaseOrders, onDelete, onDuplicate, onConvert, onShareWhatsApp }: DocumentTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "invoice" | "po" } | null>(null);
  const [filterType, setFilterType] = useState<"all" | "invoice" | "po">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DocumentStatus>("all");

  const all: DocEntry[] = [
    ...invoices.map(toDocEntry),
    ...purchaseOrders.map(toDocEntry),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = all.filter(
    (d) =>
      (filterType === "all" || d.type === filterType) &&
      (filterStatus === "all" || d.status === filterStatus)
  );

  const selectClass = "text-sm rounded-xl px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]";
  const selectStyle = {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-primary)",
  };

  if (all.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Create your first GST invoice or purchase order to get started."
        action={
          <div className="flex gap-3">
            <Link href="/invoice/new">
              <Button>Create Invoice</Button>
            </Link>
            <Link href="/purchase-order/new">
              <Button variant="secondary">Create PO</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All Types</option>
          <option value="invoice">Invoices</option>
          <option value="po">Purchase Orders</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="text-sm self-center ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Card grid: 3 cols desktop / 2 tablet / 1 mobile */}
      {filtered.length === 0 ? (
        <div
          className="rounded-bento px-6 py-12 text-center text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          No documents match the filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDuplicate={() => onDuplicate(doc.id, doc.type)}
              onDelete={() => setDeleteTarget({ id: doc.id, type: doc.type })}
              onConvert={() => onConvert(doc.id, doc.type)}
              onShareWhatsApp={() => onShareWhatsApp(doc.id, doc.type)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id, deleteTarget.type);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        This action cannot be undone. The document will be permanently deleted.
      </Modal>
    </>
  );
}
