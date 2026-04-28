"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithMagicLink: (email: string) => Promise<{ error?: string; success: boolean }>;
  signOut: () => Promise<{ error?: string; success: boolean }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, error: "Supabase is not configured yet." };
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
      },
    });

    return error ? { success: false, error: error.message } : { success: true };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, error: "Supabase is not configured yet." };
    }

    const { error } = await client.auth.signOut();
    return error ? { success: false, error: error.message } : { success: true };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    session,
    user: session?.user ?? null,
    signInWithMagicLink,
    signOut,
  }), [configured, loading, session, signInWithMagicLink, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
