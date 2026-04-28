"use client";

import type { DocumentTemplateSettings } from "@/lib/types/settings";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

export const settingsRepository = {
  async get(): Promise<RepositoryResult<DocumentTemplateSettings>> {
    const localSettings = local.getSettings();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localSettings, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("settings")
        .select("data")
        .eq("user_id", cloud.userId)
        .maybeSingle();

      if (error) throw error;
      if (!data?.data) {
        return { success: true, data: localSettings, source: "local" };
      }

      const settings = data.data as unknown as DocumentTemplateSettings;
      local.replaceSettings(settings);
      return { success: true, data: settings, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localSettings,
        source: "local",
        error: toRepositoryError(error, "Unable to load settings from cloud."),
      };
    }
  },

  async save(settings: DocumentTemplateSettings): Promise<RepositoryResult<{ settings: DocumentTemplateSettings }>> {
    const localResult = local.saveSettings(settings);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { settings }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("settings").upsert({
        user_id: cloud.userId,
        data: settings as unknown as import("@/lib/supabase/types").Json,
      });
      if (error) throw error;
      return { success: true, data: { settings }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { settings },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved settings locally, but cloud sync failed."),
      };
    }
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    const result = await this.save(local.getSettings());
    return { success: result.success, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
  },
};
