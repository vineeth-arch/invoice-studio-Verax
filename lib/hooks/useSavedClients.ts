"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedClient } from "@/lib/types/client";
import * as storage from "@/lib/storage/local";

export function useSavedClients() {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setClients(storage.getSavedClients());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  return { clients, loading, refresh };
}
