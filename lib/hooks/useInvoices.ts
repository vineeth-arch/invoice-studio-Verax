"use client";

import { useState, useEffect, useCallback } from "react";
import type { Invoice } from "@/lib/types/invoice";
import * as storage from "@/lib/storage/local";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInvoices(storage.getInvoices());
    setLoading(false);
  }, []);

  const saveInvoice = useCallback((invoice: Partial<Invoice> & { id?: string }) => {
    const result = storage.saveInvoice(invoice);
    if (result.success) setInvoices(storage.getInvoices());
    return result;
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    const result = storage.deleteInvoice(id);
    if (result.success) setInvoices(storage.getInvoices());
    return result;
  }, []);

  const getInvoice = useCallback((id: string) => {
    return storage.getInvoice(id);
  }, []);

  return { invoices, loading, saveInvoice, deleteInvoice, getInvoice };
}
