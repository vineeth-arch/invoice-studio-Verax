"use client";

import * as local from "@/lib/storage/local";
import type { SavedService } from "@/lib/types/service";
import type { RepositoryResult } from "./_shared";

export const servicesRepository = {
  async list(): Promise<RepositoryResult<SavedService[]>> {
    return { success: true, data: local.getSavedServices(), source: "local" };
  },

  async save(service: SavedService): Promise<RepositoryResult<{ service: SavedService }>> {
    const result = local.saveSavedService(service);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: { service }, source: "local", cloudSynced: false };
  },

  async delete(id: string): Promise<RepositoryResult> {
    const result = local.deleteSavedService(id);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, source: "local", cloudSynced: false };
  },
};
