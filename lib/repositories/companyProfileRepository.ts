"use client";

import type { BusinessProfile } from "@/lib/types/company";
import type { Database, Json } from "@/lib/supabase/types";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function toCloudProfile(profile: BusinessProfile, userId: string): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: userId,
    company_name: profile.companyName,
    legal_name: profile.legalName ?? null,
    gstin: profile.gstin,
    pan: profile.pan ?? null,
    email: profile.contact.email ?? null,
    phone: profile.contact.phone ?? null,
    website: profile.contact.website ?? null,
    address: profile.address as unknown as Json,
    bank_details: (profile.bankDetails ?? null) as Json | null,
    logo_url: null,
    signature_url: null,
  };
}

function fromCloudProfile(row: ProfileRow, localProfile: BusinessProfile | null): BusinessProfile {
  return {
    id: row.id,
    companyName: row.company_name ?? "",
    legalName: row.legal_name ?? undefined,
    gstin: row.gstin ?? "",
    pan: row.pan ?? undefined,
    address: (row.address as unknown as BusinessProfile["address"]) ?? localProfile?.address ?? {
      line1: "",
      city: "",
      state: "",
      stateCode: "",
      pincode: "",
      country: "India",
    },
    contact: {
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      website: row.website ?? undefined,
    },
    bankDetails: (row.bank_details as unknown as BusinessProfile["bankDetails"]) ?? undefined,
    logoImageBase64: localProfile?.logoImageBase64,
    defaultSignatoryName: localProfile?.defaultSignatoryName,
    defaultSignatureImageBase64: localProfile?.defaultSignatureImageBase64,
    defaultTermsAndConditions: localProfile?.defaultTermsAndConditions,
    defaultDeclaration: localProfile?.defaultDeclaration,
    defaultInvoicePrefix: localProfile?.defaultInvoicePrefix,
    defaultPOPrefix: localProfile?.defaultPOPrefix,
    updatedAt: row.updated_at,
  };
}

export const companyProfileRepository = {
  async get(): Promise<RepositoryResult<BusinessProfile | null>> {
    const localProfile = local.getCompanyProfile();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localProfile, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("profiles")
        .select("*")
        .eq("id", cloud.userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: true, data: localProfile, source: "local" };
      }

      const mapped = fromCloudProfile(data, localProfile);
      local.replaceCompanyProfile(mapped);
      return { success: true, data: mapped, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localProfile,
        source: "local",
        error: toRepositoryError(error, "Unable to load company profile from cloud."),
      };
    }
  },

  async save(profile: BusinessProfile): Promise<RepositoryResult<{ profile: BusinessProfile }>> {
    const localResult = local.saveCompanyProfile(profile);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { profile }, source: "local", cloudSynced: false };
    }

    try {
      const payload = toCloudProfile(profile, cloud.userId);
      const { error } = await cloud.client.from("profiles").upsert(payload);
      if (error) throw error;
      return { success: true, data: { profile }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { profile },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved locally, but cloud sync failed for company profile."),
      };
    }
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    const profile = local.getCompanyProfile();
    if (!profile) return { success: true };
    const result = await this.save(profile);
    return { success: result.success, error: result.error, cloudSynced: result.cloudSynced };
  },
};
