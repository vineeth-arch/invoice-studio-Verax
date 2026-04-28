"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/components/auth/AuthProvider";
import { clientsRepository } from "@/lib/repositories/clientsRepository";
import type { SavedClient } from "@/lib/types/client";
import type { Invoice } from "@/lib/types/invoice";

type BuyerDraft = {
  name?: string;
  billingAddress?: Partial<Invoice["buyer"]["billingAddress"]>;
  gstin?: string;
  contact?: Partial<NonNullable<Invoice["buyer"]["contact"]>>;
  placeOfSupply?: string;
  placeOfSupplyCode?: string;
};

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

  const saveClient = useCallback(async (client: SavedClient) => {
    const result = await clientsRepository.save(client);
    if (result.success) {
      setClients(await clientsRepository.list().then((listResult) => listResult.data ?? []));
    }
    return result;
  }, []);

  const saveBuyerFromInvoice = useCallback(async (buyer: BuyerDraft | undefined | null) => {
    if (!buyer?.name?.trim() || !buyer.billingAddress?.line1?.trim()) {
      return { success: false, error: "Buyer name and address line 1 are required." };
    }

    const existing = (await clientsRepository.list()).data ?? [];
    const normalizedGstin = (buyer.gstin ?? "").trim().toLowerCase();
    const matched = normalizedGstin
      ? existing.find((client) => client.gstin.trim().toLowerCase() === normalizedGstin)
      : undefined;
    const timestamp = new Date().toISOString();
    const client: SavedClient = {
      id: matched?.id ?? uuidv4(),
      name: buyer.name,
      address1: buyer.billingAddress.line1,
      address2: buyer.billingAddress.line2 ?? "",
      city: buyer.billingAddress.city ?? "",
      state: buyer.billingAddress.state ?? "",
      stateCode: buyer.billingAddress.stateCode ?? "",
      pincode: buyer.billingAddress.pincode ?? "",
      gstin: buyer.gstin ?? "",
      email: buyer.contact?.email ?? "",
      phone: buyer.contact?.phone ?? "",
      placeOfSupply: buyer.placeOfSupply ?? "",
      placeOfSupplyCode: buyer.placeOfSupplyCode ?? "",
      createdAt: matched?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return saveClient(client);
  }, [saveClient]);

  const deleteClient = useCallback(async (id: string) => {
    const result = await clientsRepository.delete(id);
    if (result.success) {
      setClients(await clientsRepository.list().then((listResult) => listResult.data ?? []));
    }
    return result;
  }, []);

  return { clients, loading, refresh, saveClient, saveBuyerFromInvoice, deleteClient };
}
