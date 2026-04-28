"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { companyProfileRepository } from "@/lib/repositories/companyProfileRepository";
import type { BusinessProfile } from "@/lib/types/company";

export function useCompanyProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await companyProfileRepository.get();
    if (result.success) {
      setProfile(result.data ?? null);
    }
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const saveProfile = useCallback(async (p: BusinessProfile) => {
    const result = await companyProfileRepository.save(p);
    if (result.success) {
      setProfile(result.data?.profile ?? p);
    }
    return result;
  }, []);

  return { profile, loading, refresh, saveProfile };
}
