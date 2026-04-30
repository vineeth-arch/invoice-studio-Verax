"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Edit, MoreVertical, RefreshCcw, Trash2, ArrowRightLeft } from "lucide-react";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { CollectionState, DocumentStatus, POStatus } from "@/lib/types/common";
import { Badge, PaymentStatusBadge, POStatusBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { getAgingBucket, getDaysOutstanding } from "@/lib/utils/aging";
import { getDisplayInvoiceNumber } from "@/lib/utils/invoiceTypes";
import { normalizeInvoiceSettlement } from "@/lib/utils/invoiceClearance";
import { cn } from "@/lib/utils/cn";

type DocEntry = {
  id: string;
  type: "invoice" | "po";
  number: string;
  partyName: string;
  date: string;
  amount: number;
  status: DocumentStatus;
  paymentStatus?: Invoice["paymentStatus"];
  collectionState?: CollectionState;
  poStatus?: PurchaseOrder["poStatus"];
  poStatusDate?: string;
  overdue90Plus?: boolean;
};

function toMonthKey(date?: string) {
  return date && date.length >= 7 ? date.slice(0, 7) : "";
}

function withinDateRange(date: string, fromDate: string, toDate: string) {
  if (!date) return false;
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

function toDocEntry(doc: Invoice | PurchaseOrder): DocEntry {
  if ("invoiceNumber" in doc) {
    const invoice = normalizeInvoiceSettlement(doc);
    return {
      id: invoice.id,
      type: "invoice",
      number: getDisplayInvoiceNumber(invoice),
      partyName: invoice.buyer.name,
      date: invoice.invoiceDate,
      amount: invoice.totals.grandTotal,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      collectionState: invoice.collectionState,
      overdue90Plus: getAgingBucket(getDaysOutstanding(invoice)) === "90+",
    };
  }
  return {
    id: doc.id,
    type: "po",
    number: doc.poNumber,
    partyName: doc.vendor.name,
    date: doc.poDate,
    amount: doc.totals.grandTotal,
    status: doc.status,
    poStatus: doc.poStatus,
    poStatusDate: doc.poStatusDate,
  };
}

function DocMenu({
  editHref,
  onDuplicate,
  onDelete,
  onConvert,
  onShareWhatsApp,
  onUpdateSettlement,
  onUpdatePOStatus,
}: {
  editHref: string;
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert?: () => void;
  onShareWhatsApp?: () => void;
  onUpdateSettlement?: () => void;
  onUpdatePOStatus?: () => void;
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
    <div ref={ref} className="relative" onClick={(event) => event.preventDefault()}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-theme-surface-raised"
        style={{ color: "var(--text-muted)" }}
        aria-label="Document actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-fade-in"
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
          {onUpdateSettlement && (
            <button
              onClick={() => { onUpdateSettlement(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
              style={{ color: "var(--text-primary)" }}
            >
              <RefreshCcw className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              Update Settlement
            </button>
          )}
          {onUpdatePOStatus && (
            <button
              onClick={() => { onUpdatePOStatus(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-theme-surface-raised"
              style={{ color: "var(--text-primary)" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              Update PO Status
            </button>
          )}
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

function DocCard({
  doc,
  onDuplicate,
  onDelete,
  onConvert,
  onShareWhatsApp,
  onUpdateSettlement,
  onUpdatePOStatus,
}: {
  doc: DocEntry;
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert: () => void;
  onShareWhatsApp: () => void;
  onUpdateSettlement: () => void;
  onUpdatePOStatus: () => void;
}) {
  const editHref = `/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`;
  const isInvoice = doc.type === "invoice";
  const canConvert = !isInvoice && doc.status === "FINAL" && doc.poStatus === "Approved";
  const canShareWhatsApp = isInvoice ? doc.status === "FINAL" : doc.status === "FINAL" && doc.poStatus === "Approved";

  return (
    <div
      className="group relative rounded-card flex flex-col gap-4 p-5 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
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
          onUpdateSettlement={isInvoice ? onUpdateSettlement : undefined}
          onUpdatePOStatus={!isInvoice ? onUpdatePOStatus : undefined}
        />
      </div>

      <Link href={editHref} className="block group-hover:opacity-80 transition-opacity">
        <p className="font-mono text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>
          {doc.number}
        </p>
        <h3 className="font-display font-bold text-[17px] mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>
          {doc.partyName}
        </h3>
      </Link>

      <div className="font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        {formatCurrencyINR(doc.amount)}
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <div>
          <span className="text-xs block" style={{ color: "var(--text-muted)" }}>
            {formatDate(doc.date)}
          </span>
          {doc.type === "po" && doc.poStatusDate ? (
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              Status updated {formatDate(doc.poStatusDate)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <StatusBadge status={doc.status} />
          {isInvoice && doc.paymentStatus && <PaymentStatusBadge status={doc.paymentStatus} />}
          {isInvoice && doc.collectionState && <Badge variant="default">{doc.collectionState}</Badge>}
          {isInvoice && doc.overdue90Plus && <Badge variant="error">Overdue 90+</Badge>}
          {!isInvoice && doc.poStatus && <POStatusBadge status={doc.poStatus} />}
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
  onUpdateSettlement: (id: string) => void;
  onUpdatePOStatus: (id: string) => void;
}

export function DocumentTable({
  invoices,
  purchaseOrders,
  onDelete,
  onDuplicate,
  onConvert,
  onShareWhatsApp,
  onUpdateSettlement,
  onUpdatePOStatus,
}: DocumentTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "invoice" | "po" } | null>(null);
  const [filterType, setFilterType] = useState<"all" | "invoice" | "po">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DocumentStatus>("all");
  const [filterCollectionState, setFilterCollectionState] = useState<"all" | CollectionState>("all");
  const [filterPOStatus, setFilterPOStatus] = useState<"all" | POStatus>("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const all: DocEntry[] = useMemo(
    () => [...invoices.map(toDocEntry), ...purchaseOrders.map(toDocEntry)].sort((a, b) => b.date.localeCompare(a.date)),
    [invoices, purchaseOrders],
  );

  const monthOptions = useMemo(
    () => Array.from(new Set(all.map((doc) => toMonthKey(doc.date)).filter(Boolean))).sort().reverse(),
    [all],
  );

  const filtered = all.filter((doc) => {
    if (filterType !== "all" && doc.type !== filterType) return false;
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    if (filterMonth !== "all" && toMonthKey(doc.date) !== filterMonth) return false;
    if ((fromDate || toDate) && !withinDateRange(doc.date, fromDate, toDate)) return false;
    if (doc.type === "invoice" && filterCollectionState !== "all" && doc.collectionState !== filterCollectionState) return false;
    if (doc.type === "po" && filterPOStatus !== "all" && doc.poStatus !== filterPOStatus) return false;
    return true;
  });

  const selectClass = cn(
    "text-sm rounded-xl px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]",
  );
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
        action={(
          <div className="flex gap-3">
            <Link href="/invoice/new">
              <Button>Create Invoice</Button>
            </Link>
            <Link href="/purchase-order/new">
              <Button variant="secondary">Create PO</Button>
            </Link>
          </div>
        )}
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterType} onChange={(event) => setFilterType(event.target.value as typeof filterType)} className={selectClass} style={selectStyle}>
          <option value="all">All Types</option>
          <option value="invoice">Invoices</option>
          <option value="po">Purchase Orders</option>
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)} className={selectClass} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={filterCollectionState} onChange={(event) => setFilterCollectionState(event.target.value as typeof filterCollectionState)} className={selectClass} style={selectStyle}>
          <option value="all">All Invoice States</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Recovered">Partially Recovered</option>
          <option value="Base Cleared / GST Pending">Base Cleared / GST Pending</option>
          <option value="Fully Recovered From Client">Fully Recovered From Client</option>
        </select>
        <select value={filterPOStatus} onChange={(event) => setFilterPOStatus(event.target.value as typeof filterPOStatus)} className={selectClass} style={selectStyle}>
          <option value="all">All PO States</option>
          <option value="Under Approval">Under Approval</option>
          <option value="Approved">Approved</option>
          <option value="Processed">Processed</option>
        </select>
        <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)} className={selectClass} style={selectStyle}>
          <option value="all">All Months</option>
          {monthOptions.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={selectClass} style={selectStyle} />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={selectClass} style={selectStyle} />
        <span className="text-sm self-center ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-bento px-6 py-12 text-center text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          No documents match the selected filters.
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
              onUpdateSettlement={() => onUpdateSettlement(doc.id)}
              onUpdatePOStatus={() => onUpdatePOStatus(doc.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document?"
        actions={(
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
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
        )}
      >
        This action cannot be undone. The document will be permanently deleted.
      </Modal>
    </>
  );
}
