"use client";

import { useState, useEffect, useCallback } from "react";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import * as storage from "@/lib/storage/local";

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPurchaseOrders(storage.getPurchaseOrders());
    setLoading(false);
  }, []);

  const savePurchaseOrder = useCallback((po: Partial<PurchaseOrder> & { id?: string }) => {
    const result = storage.savePurchaseOrder(po);
    if (result.success) setPurchaseOrders(storage.getPurchaseOrders());
    return result;
  }, []);

  const deletePurchaseOrder = useCallback((id: string) => {
    const result = storage.deletePurchaseOrder(id);
    if (result.success) setPurchaseOrders(storage.getPurchaseOrders());
    return result;
  }, []);

  const getPurchaseOrder = useCallback((id: string) => {
    return storage.getPurchaseOrder(id);
  }, []);

  return { purchaseOrders, loading, savePurchaseOrder, deletePurchaseOrder, getPurchaseOrder };
}
