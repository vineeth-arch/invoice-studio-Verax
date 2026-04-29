"use client";

import { mergeCompanyProfileWithDefaults } from "@/lib/defaults/companyProfile";
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
    trade_name: profile.tradeName ?? null,
    display_brand_name: profile.displayBrandName ?? null,
    constitution: profile.constitution ?? null,
    gstin: profile.gstin,
    registration_type: profile.registrationType ?? null,
    gst_registration_valid_from: profile.gstRegistrationValidFrom ?? null,
    pan: profile.pan ?? null,
    email: profile.contact.email ?? null,
    phone: profile.contact.phone ?? null,
    website: profile.contact.website ?? null,
    address: profile.address as unknown as Json,
    bank_details: (profile.bankDetails ?? null) as Json | null,
    logo_url: null,
    signature_url: null,
    default_signatory_name: profile.defaultSignatoryName ?? null,
    default_terms: profile.defaultTermsAndConditions ?? null,
    default_declaration: profile.defaultDeclaration ?? null,
    default_invoice_prefix: profile.defaultInvoicePrefix ?? "INV",
    default_po_prefix: profile.defaultPOPrefix ?? "PO",
    logo_base64: profile.logoImageBase64 ?? null,
    signature_base64: profile.defaultSignatureImageBase64 ?? null,
    default_notes: profile.defaultNotes ?? null,
  };
}

function fromCloudProfile(row: ProfileRow, localProfile: BusinessProfile | null): BusinessProfile {
  return mergeCompanyProfileWithDefaults({
    id: row.id,
    companyName: row.company_name ?? undefined,
    legalName: row.legal_name ?? undefined,
    tradeName: row.trade_name ?? undefined,
    displayBrandName: row.display_brand_name ?? undefined,
    constitution: row.constitution ?? undefined,
    gstin: row.gstin ?? undefined,
    registrationType: row.registration_type ?? undefined,
    gstRegistrationValidFrom: row.gst_registration_valid_from ?? undefined,
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
    logoImageBase64: row.logo_base64 ?? localProfile?.logoImageBase64,
    defaultSignatoryName: row.default_signatory_name ?? localProfile?.defaultSignatoryName,
    defaultSignatureImageBase64: row.signature_base64 ?? localProfile?.defaultSignatureImageBase64,
    defaultTermsAndConditions: row.default_terms ?? localProfile?.defaultTermsAndConditions,
    defaultDeclaration: row.default_declaration ?? localProfile?.defaultDeclaration,
    defaultNotes: row.default_notes ?? localProfile?.defaultNotes,
    defaultInvoicePrefix: row.default_invoice_prefix ?? localProfile?.defaultInvoicePrefix,
    defaultPOPrefix: row.default_po_prefix ?? localProfile?.defaultPOPrefix,
    updatedAt: row.updated_at,
  });
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
        if (localProfile) {
          await cloud.client.from("profiles").upsert(toCloudProfile(localProfile, cloud.userId));
        }
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
    const mergedProfile = mergeCompanyProfileWithDefaults(profile);
    const localResult = local.saveCompanyProfile(mergedProfile);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { profile: mergedProfile }, source: "local", cloudSynced: false };
    }

    try {
      const payload = toCloudProfile(mergedProfile, cloud.userId);
      const { error } = await cloud.client.from("profiles").upsert(payload);
      if (error) throw error;
      return { success: true, data: { profile: mergedProfile }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { profile: mergedProfile },
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
