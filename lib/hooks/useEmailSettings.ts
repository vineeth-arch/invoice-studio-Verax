"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmailSettings } from "@/lib/types/email";

const EMAIL_SETTINGS_KEY = "di_email_settings";

function readEmailSettings(): EmailSettings {
  if (typeof window === "undefined") {
    return { fromName: "", fromEmail: "", signature: "" };
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_SETTINGS_KEY);
    if (!raw) {
      return { fromName: "", fromEmail: "", signature: "" };
    }

    const parsed = JSON.parse(raw) as Partial<EmailSettings>;
    return {
      fromName: parsed.fromName ?? "",
      fromEmail: parsed.fromEmail ?? "",
      signature: parsed.signature ?? "",
    };
  } catch {
    return { fromName: "", fromEmail: "", signature: "" };
  }
}

function writeEmailSettings(settings: EmailSettings) {
  if (typeof window === "undefined") {
    return { success: false, error: "Server-side" };
  }

  try {
    window.localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save email settings." };
  }
}

export function useEmailSettings(defaultFromName?: string) {
  const [settings, setSettings] = useState<EmailSettings>({
    fromName: defaultFromName ?? "",
    fromEmail: "",
    signature: "",
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const stored = readEmailSettings();
    setSettings((current) => ({
      fromName: stored.fromName || defaultFromName || current.fromName || "",
      fromEmail: stored.fromEmail,
      signature: stored.signature,
    }));
    setLoading(false);
  }, [defaultFromName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSettings = useCallback(async (nextSettings: EmailSettings) => {
    const result = writeEmailSettings(nextSettings);
    if (result.success) {
      setSettings(nextSettings);
    }
    return result;
  }, []);

  return { settings, loading, refresh, saveSettings };
}
