"use client";

import { useState, useEffect, useCallback } from "react";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import * as storage from "@/lib/storage/local";

export function useSettings() {
  const [settings, setSettings] = useState<DocumentTemplateSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettings(storage.getSettings());
    setLoading(false);
  }, []);

  const saveSettings = useCallback((s: DocumentTemplateSettings) => {
    const result = storage.saveSettings(s);
    if (result.success) setSettings(storage.getSettings());
    return result;
  }, []);

  return { settings, loading, saveSettings };
}
