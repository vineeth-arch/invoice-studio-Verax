"use client";

import type { SavedClient } from "@/lib/types/client";
import type { Database, Json } from "@/lib/supabase/types";
import type { Invoice } from "@/lib/types/invoice";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function toCloudClient(client: SavedClient, userId: string): Database["public"]["Tables"]["clients"]["Insert"] {
  return {
    id: client.id,
    user_id: userId,
    name: client.name,
    gstin: client.gstin ?? null,
    email: client.contact?.email ?? null,
    phone: client.contact?.phone ?? null,
    address: client.billingAddress as unknown as Json,
    place_of_supply: client.placeOfSupply,
    state_code: client.placeOfSupplyCode,
    updated_at: client.lastUsedAt,
  };
}

function fromCloudClient(row: ClientRow): SavedClient {
  return {
    id: row.id,
    name: row.name,
    billingAddress: row.address as unknown as SavedClient["billingAddress"],
    gstin: row.gstin ?? undefined,
    contact: {
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
    },
    placeOfSupply: row.place_of_supply ?? "",
    placeOfSupplyCode: row.state_code ?? "",
    lastUsedAt: row.updated_at,
  };
}

export const clientsRepository = {
  async list(): Promise<RepositoryResult<SavedClient[]>> {
    const localClients = local.getSavedClients();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localClients, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("clients")
        .select("*")
        .eq("user_id", cloud.userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const clients = (data ?? []).map(fromCloudClient);
      local.replaceSavedClients(clients);
      return { success: true, data: clients, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localClients,
        source: "local",
        error: toRepositoryError(error, "Unable to load saved clients from cloud."),
      };
    }
  },

  async save(client: SavedClient): Promise<RepositoryResult<{ client: SavedClient }>> {
    const localResult = local.saveSavedClient(client);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { client }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("clients").upsert(toCloudClient(client, cloud.userId));
      if (error) throw error;
      return { success: true, data: { client }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { client },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved client locally, but cloud sync failed."),
      };
    }
  },

  async saveBuyerFromInvoice(buyer: Invoice["buyer"] | undefined | null): Promise<RepositoryResult> {
    const localResult = local.saveBuyerAsClient(buyer);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const saved = local.getSavedClients()[0];
    if (!saved || !buyer?.name?.trim()) {
      return { success: true, cloudSynced: false };
    }

    const result = await this.save(saved);
    return { success: result.success, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    const clients = local.getSavedClients();
    for (const client of clients) {
      const result = await this.save(client);
      if (!result.success) {
        return { success: false, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
      }
    }
    return { success: true, cloudSynced: true };
  },
};
