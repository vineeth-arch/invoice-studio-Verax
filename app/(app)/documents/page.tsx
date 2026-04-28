"use client";

import { useCallback } from "react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useToast } from "@/lib/hooks/useToast";
import { DocumentTable } from "@/components/document/DocumentTable";
import { v4 as uuidv4 } from "uuid";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

export default function DocumentsPage() {
  const { invoices, loading: invLoading, deleteInvoice, saveInvoice } = useInvoices();
  const { purchaseOrders, loading: poLoading, deletePurchaseOrder, savePurchaseOrder } = usePurchaseOrders();
  const { addToast } = useToast();

  const handleDelete = useCallback((id: string, type: "invoice" | "po") => {
    const result = type === "invoice" ? deleteInvoice(id) : deletePurchaseOrder(id);
    if (result.success) addToast("Document deleted.", "success");
    else addToast(result.error ?? "Failed to delete.", "error");
  }, [deleteInvoice, deletePurchaseOrder, addToast]);

  const handleDuplicate = useCallback((id: string, type: "invoice" | "po") => {
    const now = new Date().toISOString();
    if (type === "invoice") {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return;
      const dup: Partial<Invoice> = { ...inv, id: uuidv4(), invoiceNumber: `${inv.invoiceNumber}-COPY`, status: "DRAFT", createdAt: now, updatedAt: now };
      const result = saveInvoice(dup);
      if (result.success) addToast("Invoice duplicated.", "success");
    } else {
      const po = purchaseOrders.find((p) => p.id === id);
      if (!po) return;
      const dup: Partial<PurchaseOrder> = { ...po, id: uuidv4(), poNumber: `${po.poNumber}-COPY`, status: "DRAFT", createdAt: now, updatedAt: now };
      const result = savePurchaseOrder(dup);
      if (result.success) addToast("Purchase order duplicated.", "success");
    }
  }, [invoices, purchaseOrders, saveInvoice, savePurchaseOrder, addToast]);

  if (invLoading || poLoading) return <div className="p-8 text-slate-400">Loading documents...</div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 text-sm">All your invoices and purchase orders</p>
      </div>
      <DocumentTable
        invoices={invoices}
        purchaseOrders={purchaseOrders}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}
