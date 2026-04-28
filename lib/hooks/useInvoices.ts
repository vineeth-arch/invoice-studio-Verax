"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { invoicesRepository } from "@/lib/repositories/invoicesRepository";
import type { Invoice } from "@/lib/types/invoice";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await invoicesRepository.list();
    if (result.success) {
      setInvoices(result.data ?? []);
    }
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const saveInvoice = useCallback(async (invoice: Partial<Invoice> & { id?: string }) => {
    const result = await invoicesRepository.save(invoice as Invoice);
    if (result.success) {
      await refresh();
    }
    return {
      success: result.success,
      error: result.error,
      id: result.data?.id,
      cloudSynced: result.cloudSynced,
      source: result.source,
    };
  }, [refresh]);

  const deleteInvoice = useCallback(async (id: string) => {
    const result = await invoicesRepository.delete(id);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find((invoice) => invoice.id === id);
  }, [invoices]);

  return { invoices, loading, refresh, saveInvoice, deleteInvoice, getInvoice };
}
