"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Copy, Trash2 } from "lucide-react";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { DocumentStatus } from "@/lib/types/common";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { EmptyState } from "@/components/ui/EmptyState";

type DocEntry = {
  id: string;
  type: "invoice" | "po";
  number: string;
  partyName: string;
  date: string;
  amount: number;
  status: DocumentStatus;
};

function toDocEntry(doc: Invoice | PurchaseOrder): DocEntry {
  if ("invoiceNumber" in doc) {
    return {
      id: doc.id,
      type: "invoice",
      number: doc.invoiceNumber,
      partyName: doc.buyer.name,
      date: doc.invoiceDate,
      amount: doc.totals.grandTotal,
      status: doc.status,
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
  };
}

interface DocumentTableProps {
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  onDelete: (id: string, type: "invoice" | "po") => void;
  onDuplicate: (id: string, type: "invoice" | "po") => void;
}

export function DocumentTable({ invoices, purchaseOrders, onDelete, onDuplicate }: DocumentTableProps) {
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

  if (all.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Create your first GST invoice or purchase order to get started."
        action={
          <div className="flex gap-3">
            <Link href="/invoice/new"><Button>Create Invoice</Button></Link>
            <Link href="/purchase-order/new"><Button variant="secondary">Create PO</Button></Link>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white"
        >
          <option value="all">All Types</option>
          <option value="invoice">Invoices</option>
          <option value="po">Purchase Orders</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              {["Type", "Number", "Party", "Date", "Amount", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No documents match the filter.</td></tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${doc.type === "invoice" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {doc.type === "invoice" ? "Invoice" : "PO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.number}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{doc.partyName}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(doc.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrencyINR(doc.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/${doc.type === "invoice" ? "invoice" : "purchase-order"}/${doc.id}/edit`}>
                        <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => onDuplicate(doc.id, doc.type)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ id: doc.id, type: doc.type })} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteTarget) { onDelete(deleteTarget.id, deleteTarget.type); setDeleteTarget(null); }
            }}>Delete</Button>
          </>
        }
      >
        This action cannot be undone. The document will be permanently deleted.
      </Modal>
    </>
  );
}
