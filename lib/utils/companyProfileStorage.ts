import { getDefaultCompanyProfile, mergeCompanyProfileWithDefaults } from "@/lib/defaults/companyProfile";
import type { BusinessProfile } from "@/lib/types/company";

const COMPANY_PROFILE_KEYS = ["di_company_profile", "di_gstin_company_profile"] as const;

function parseProfile(raw: string | null): Partial<BusinessProfile> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<BusinessProfile>;
  } catch {
    return null;
  }
}

export function getStoredCompanyProfileForForms(): BusinessProfile | null {
  if (typeof window === "undefined") return null;

  const preferred = parseProfile(window.localStorage.getItem(COMPANY_PROFILE_KEYS[0]));
  if (preferred) {
    return mergeCompanyProfileWithDefaults(preferred);
  }

  const legacy = parseProfile(window.localStorage.getItem(COMPANY_PROFILE_KEYS[1]));
  if (!legacy) return null;

  const mergedLegacy = mergeCompanyProfileWithDefaults(legacy);
  const defaultProfile = getDefaultCompanyProfile();
  return JSON.stringify(mergedLegacy) === JSON.stringify(defaultProfile) ? null : mergedLegacy;
}
