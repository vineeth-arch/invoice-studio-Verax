"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { purchaseOrdersRepository } from "@/lib/repositories/purchaseOrdersRepository";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await purchaseOrdersRepository.list();
    if (result.success) {
      setPurchaseOrders(result.data ?? []);
    }
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const savePurchaseOrder = useCallback(async (po: Partial<PurchaseOrder> & { id?: string }) => {
    const result = await purchaseOrdersRepository.save(po as PurchaseOrder);
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
  }, []);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    const result = await purchaseOrdersRepository.delete(id);
    if (result.success) {
      await refresh();
    }
    return result;
  }, []);

  const getPurchaseOrder = useCallback((id: string) => {
    return purchaseOrders.find((po) => po.id === id);
  }, [purchaseOrders]);

  return { purchaseOrders, loading, refresh, savePurchaseOrder, deletePurchaseOrder, getPurchaseOrder };
}
