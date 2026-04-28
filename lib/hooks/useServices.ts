"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { servicesRepository } from "@/lib/repositories/servicesRepository";
import type { SavedService } from "@/lib/types/service";

export function useServices() {
  const [services, setServices] = useState<SavedService[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await servicesRepository.list();
    if (result.success) {
      setServices(result.data ?? []);
    }
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const saveService = useCallback(async (service: SavedService) => {
    const result = await servicesRepository.save(service);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const deleteService = useCallback(async (id: string) => {
    const result = await servicesRepository.delete(id);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  return { services, loading, refresh, saveService, deleteService };
}
