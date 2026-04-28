"use client";

import type { DocumentTemplateSettings, NumberingConfig } from "@/lib/types/settings";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

export interface DocumentNumberingState {
  invoiceNumbering: NumberingConfig;
  poNumbering: NumberingConfig;
  storedFinancialYear: string;
  updatedAt: string;
}

function extractNumbering(settings: DocumentTemplateSettings): DocumentNumberingState {
  return {
    invoiceNumbering: settings.invoiceNumbering,
    poNumbering: settings.poNumbering,
    storedFinancialYear: settings.storedFinancialYear,
    updatedAt: settings.updatedAt,
  };
}

function applyNumbering(settings: DocumentTemplateSettings, numbering: DocumentNumberingState): DocumentTemplateSettings {
  return {
    ...settings,
    invoiceNumbering: numbering.invoiceNumbering,
    poNumbering: numbering.poNumbering,
    storedFinancialYear: numbering.storedFinancialYear,
    updatedAt: numbering.updatedAt,
  };
}

export const documentNumberingRepository = {
  async get(): Promise<RepositoryResult<DocumentNumberingState>> {
    const localSettings = local.getSettings();
    const localNumbering = extractNumbering(localSettings);
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localNumbering, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("document_numbering")
        .select("data")
        .eq("user_id", cloud.userId)
        .maybeSingle();

      if (error) throw error;
      if (!data?.data) {
        return { success: true, data: localNumbering, source: "local" };
      }

      const numbering = data.data as unknown as DocumentNumberingState;
      local.replaceSettings(applyNumbering(localSettings, numbering));
      return { success: true, data: numbering, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localNumbering,
        source: "local",
        error: toRepositoryError(error, "Unable to load numbering state from cloud."),
      };
    }
  },

  async save(numbering: DocumentNumberingState): Promise<RepositoryResult<{ numbering: DocumentNumberingState }>> {
    const settings = applyNumbering(local.getSettings(), numbering);
    const localResult = local.saveSettings(settings);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { numbering }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("document_numbering").upsert({
        user_id: cloud.userId,
        data: numbering as unknown as import("@/lib/supabase/types").Json,
      });
      if (error) throw error;
      return { success: true, data: { numbering }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { numbering },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved numbering locally, but cloud sync failed."),
      };
    }
  },

  async incrementInvoiceSequence(): Promise<RepositoryResult<DocumentNumberingState>> {
    const settings = local.getSettings();
    const next = extractNumbering({
      ...settings,
      invoiceNumbering: {
        ...settings.invoiceNumbering,
        currentSequence: settings.invoiceNumbering.currentSequence + 1,
      },
      updatedAt: new Date().toISOString(),
    });
    const result = await this.save(next);
    return { success: result.success, data: next, error: result.error, cloudSynced: result.cloudSynced };
  },

  async incrementPOSequence(): Promise<RepositoryResult<DocumentNumberingState>> {
    const settings = local.getSettings();
    const next = extractNumbering({
      ...settings,
      poNumbering: {
        ...settings.poNumbering,
        currentSequence: settings.poNumbering.currentSequence + 1,
      },
      updatedAt: new Date().toISOString(),
    });
    const result = await this.save(next);
    return { success: result.success, data: next, error: result.error, cloudSynced: result.cloudSynced };
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    const result = await this.save(extractNumbering(local.getSettings()));
    return { success: result.success, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
  },
};
