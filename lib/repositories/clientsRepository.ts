"use client";

import type { SavedClient } from "@/lib/types/client";
import type { Database, Json } from "@/lib/supabase/types";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function toCloudClient(client: SavedClient, userId: string): Database["public"]["Tables"]["clients"]["Insert"] {
  return {
    id: client.id,
    user_id: userId,
    name: client.name,
    gstin: client.gstin || null,
    email: client.email || null,
    phone: client.phone || null,
    address: {
      line1: client.address1,
      line2: client.address2,
      city: client.city,
      state: client.state,
      stateCode: client.stateCode,
      pincode: client.pincode,
      country: "India",
    } as Json,
    place_of_supply: client.placeOfSupply,
    state_code: client.placeOfSupplyCode,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

function fromCloudClient(row: ClientRow): SavedClient {
  const address = (row.address ?? {}) as Record<string, string | undefined>;
  return {
    id: row.id,
    name: row.name,
    address1: address.line1 ?? "",
    address2: address.line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    stateCode: address.stateCode ?? row.state_code ?? "",
    pincode: address.pincode ?? "",
    gstin: row.gstin ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    placeOfSupply: row.place_of_supply ?? "",
    placeOfSupplyCode: row.state_code ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

  async delete(id: string): Promise<RepositoryResult> {
    const localResult = local.deleteSavedClient(id);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("clients").delete().eq("user_id", cloud.userId).eq("id", id);
      if (error) throw error;
      return { success: true, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Deleted client locally, but cloud delete failed."),
      };
    }
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
