"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { clientsRepository } from "@/lib/repositories/clientsRepository";
import type { Invoice } from "@/lib/types/invoice";
import type { SavedClient } from "@/lib/types/client";

export function useSavedClients() {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await clientsRepository.list();
    if (result.success) {
      setClients(result.data ?? []);
    }
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const saveBuyerFromInvoice = useCallback(async (buyer: Invoice["buyer"] | undefined | null) => {
    const result = await clientsRepository.saveBuyerFromInvoice(buyer);
    if (result.success) {
      setClients(await clientsRepository.list().then((listResult) => listResult.data ?? []));
    }
    return result;
  }, []);

  return { clients, loading, refresh, saveBuyerFromInvoice };
}
