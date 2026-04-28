"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface RepositoryResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  cloudSynced?: boolean;
  source?: "local" | "cloud";
}

export async function getCloudContext() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  return { client, user: data.user, userId: data.user.id };
}

export function toRepositoryError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
