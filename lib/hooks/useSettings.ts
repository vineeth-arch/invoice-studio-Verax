"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  documentNumberingRepository,
  type DocumentNumberingState,
} from "@/lib/repositories/documentNumberingRepository";
import { settingsRepository } from "@/lib/repositories/settingsRepository";
import type { DocumentTemplateSettings } from "@/lib/types/settings";

function extractNumbering(settings: DocumentTemplateSettings): DocumentNumberingState {
  return {
    invoiceNumbering: settings.invoiceNumbering,
    poNumbering: settings.poNumbering,
    storedFinancialYear: settings.storedFinancialYear,
    updatedAt: settings.updatedAt,
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<DocumentTemplateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const settingsResult = await settingsRepository.get();
    if (!settingsResult.success) {
      setLoading(false);
      return settingsResult;
    }

    let nextSettings = settingsResult.data ?? null;
    const numberingResult = await documentNumberingRepository.get();

    if (nextSettings && numberingResult.success && numberingResult.data) {
      nextSettings = {
        ...nextSettings,
        invoiceNumbering: numberingResult.data.invoiceNumbering,
        poNumbering: numberingResult.data.poNumbering,
        storedFinancialYear: numberingResult.data.storedFinancialYear,
        updatedAt: numberingResult.data.updatedAt,
      };
    }

    setSettings(nextSettings);
    setLoading(false);
    return settingsResult;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const saveSettings = useCallback(async (nextSettings: DocumentTemplateSettings) => {
    const settingsResult = await settingsRepository.save(nextSettings);
    if (!settingsResult.success) {
      return settingsResult;
    }

    const numberingResult = await documentNumberingRepository.save(extractNumbering(nextSettings));
    const combinedSuccess = settingsResult.success && numberingResult.success;

    if (combinedSuccess) {
      setSettings(settingsResult.data?.settings ?? nextSettings);
    }

    return {
      success: combinedSuccess,
      data: settingsResult.data,
      error: settingsResult.error ?? numberingResult.error,
      cloudSynced: settingsResult.cloudSynced && numberingResult.cloudSynced,
      source: settingsResult.source,
    };
  }, []);

  return { settings, loading, refresh, saveSettings };
}
