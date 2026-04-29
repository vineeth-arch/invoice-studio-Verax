"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { formatCurrencyINR, formatDate } from "@/lib/utils/formatting";
import { useToast } from "@/lib/hooks/useToast";

type DraftTab = "invoices" | "purchase-orders";

type DraftItem =
  | {
      id: string;
      type: "invoice";
      number: string;
      partyName: string;
      date: string;
      amount: number;
      updatedAt: string;
      editHref: string;
    }
  | {
      id: string;
      type: "purchase-order";
      number: string;
      partyName: string;
      date: string;
      amount: number;
      updatedAt: string;
      editHref: string;
    };

export default function DraftsPage() {
  const [activeTab, setActiveTab] = useState<DraftTab>("invoices");
  const [pendingDelete, setPendingDelete] = useState<DraftItem | null>(null);
  const { invoices, loading: invoicesLoading, deleteInvoice } = useInvoices();
  const { purchaseOrders, loading: purchaseOrdersLoading, deletePurchaseOrder } = usePurchaseOrders();
  const { addToast } = useToast();

  const draftInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "DRAFT")
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()),
    [invoices]
  );

  const draftPurchaseOrders = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status === "DRAFT")
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()),
    [purchaseOrders]
  );

  const invoiceItems = useMemo<DraftItem[]>(
    () =>
      draftInvoices.map((invoice: Invoice) => ({
        id: invoice.id,
        type: "invoice",
        number: invoice.invoiceNumber,
        partyName: invoice.buyer.name,
        date: invoice.createdAt || invoice.updatedAt || invoice.invoiceDate,
        amount: invoice.totals?.grandTotal ?? 0,
        updatedAt: invoice.updatedAt ?? invoice.createdAt,
        editHref: `/invoice/${invoice.id}/edit`,
      })),
    [draftInvoices]
  );

  const poItems = useMemo<DraftItem[]>(
    () =>
      draftPurchaseOrders.map((po: PurchaseOrder) => ({
        id: po.id,
        type: "purchase-order",
        number: po.poNumber,
        partyName: po.vendor.name,
        date: po.createdAt || po.updatedAt || po.poDate,
        amount: po.totals?.grandTotal ?? 0,
        updatedAt: po.updatedAt ?? po.createdAt,
        editHref: `/purchase-order/${po.id}/edit`,
      })),
    [draftPurchaseOrders]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const result = pendingDelete.type === "invoice"
      ? await deleteInvoice(pendingDelete.id)
      : await deletePurchaseOrder(pendingDelete.id);

    if (result.success) {
      addToast("Draft deleted.", "success");
      setPendingDelete(null);
      return;
    }

    addToast(result.error ?? "Failed to delete draft.", "error");
  }, [addToast, deleteInvoice, deletePurchaseOrder, pendingDelete]);

  if (invoicesLoading || purchaseOrdersLoading) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Loading drafts…
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] p-5 md:p-7">
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
          Drafts
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Invoices and POs saved as draft
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === "invoices" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Invoices ({invoiceItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("purchase-orders")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === "purchase-orders" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Purchase Orders ({poItems.length})
        </button>
      </div>

      {activeTab === "invoices" ? (
        <DraftList
          type="invoice"
          items={invoiceItems}
          emptyHref="/invoice/new"
          onDelete={setPendingDelete}
        />
      ) : (
        <DraftList
          type="purchase-order"
          items={poItems}
          emptyHref="/purchase-order/new"
          onDelete={setPendingDelete}
        />
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this draft?"
        actions={(
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </>
        )}
      >
        <p>This cannot be undone.</p>
      </Modal>
    </div>
  );
}

function DraftList({
  items,
  type,
  emptyHref,
  onDelete,
}: {
  items: DraftItem[];
  type: DraftItem["type"];
  emptyHref: string;
  onDelete: (item: DraftItem) => void;
}) {
  if (items.length === 0) {
    const isInvoice = type === "invoice";

    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm text-slate-600">
          {isInvoice
            ? "No draft invoices. Start creating one from New Invoice."
            : "No draft POs. Start creating one from New PO."}
        </p>
        <Link
          href={emptyHref}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 transition-opacity hover:opacity-90"
        >
          {isInvoice ? "New Invoice" : "New PO"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Icon = item.type === "invoice" ? FileText : ShoppingCart;
        const numberLabel = item.number.trim() ? item.number : "Draft — no number";

        return (
          <div
            key={item.id}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{numberLabel}</h2>
                    <p className="text-sm text-slate-600">{item.partyName || "Unnamed client/vendor"}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                  <span>Date created: {formatDate(item.date)}</span>
                  <span>Grand total: {formatCurrencyINR(item.amount)}</span>
                  <span>Last updated: {formatDate(item.updatedAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={item.editHref}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Continue Editing
                </Link>
                <Button type="button" variant="outline" onClick={() => onDelete(item)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
