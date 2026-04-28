"use client";

import { useState, useEffect, useCallback } from "react";
import type { BusinessProfile } from "@/lib/types/company";
import * as storage from "@/lib/storage/local";

export function useCompanyProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(storage.getCompanyProfile());
    setLoading(false);
  }, []);

  const saveProfile = useCallback((p: BusinessProfile) => {
    const result = storage.saveCompanyProfile(p);
    if (result.success) setProfile(storage.getCompanyProfile());
    return result;
  }, []);

  return { profile, loading, saveProfile };
}
