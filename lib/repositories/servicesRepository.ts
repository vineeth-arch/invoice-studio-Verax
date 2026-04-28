"use client";

import type { Database } from "@/lib/supabase/types";
import * as local from "@/lib/storage/local";
import type { SavedService } from "@/lib/types/service";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

function toCloudService(service: SavedService, userId: string): Database["public"]["Tables"]["services"]["Insert"] {
  return {
    id: service.id,
    user_id: userId,
    description: service.description,
    sac_code: service.sacCode || null,
    unit: service.unit,
    default_rate: service.defaultRate,
    default_gst_percent: service.defaultGstPercent,
    created_at: service.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function fromCloudService(row: ServiceRow): SavedService {
  return {
    id: row.id,
    description: row.description,
    sacCode: row.sac_code ?? "",
    unit: row.unit ?? "PCS",
    defaultRate: Number(row.default_rate) || 0,
    defaultGstPercent: Number(row.default_gst_percent) || 0,
    createdAt: row.created_at,
  };
}

export const servicesRepository = {
  async list(): Promise<RepositoryResult<SavedService[]>> {
    const localServices = local.getSavedServices();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localServices, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("services")
        .select("*")
        .eq("user_id", cloud.userId)
        .order("description", { ascending: true });

      if (error) throw error;
      const services = (data ?? []).map(fromCloudService);
      local.replaceSavedServices(services);
      return { success: true, data: services, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localServices,
        source: "local",
        error: toRepositoryError(error, "Unable to load saved services from cloud."),
      };
    }
  },

  async save(service: SavedService): Promise<RepositoryResult<{ service: SavedService }>> {
    const localResult = local.saveSavedService(service);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { service }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("services").upsert(toCloudService(service, cloud.userId));
      if (error) throw error;
      return { success: true, data: { service }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { service },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved service locally, but cloud sync failed."),
      };
    }
  },

  async delete(id: string): Promise<RepositoryResult> {
    const localResult = local.deleteSavedService(id);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("services").delete().eq("user_id", cloud.userId).eq("id", id);
      if (error) throw error;
      return { success: true, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Deleted service locally, but cloud delete failed."),
      };
    }
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    const services = local.getSavedServices();
    for (const service of services) {
      const result = await this.save(service);
      if (!result.success) {
        return { success: false, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
      }
    }
    return { success: true, cloudSynced: true };
  },
};
