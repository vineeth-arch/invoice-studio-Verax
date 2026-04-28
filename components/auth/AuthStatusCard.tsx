"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function AuthStatusCard() {
  const { configured, loading, user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const email = user?.email ?? "";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!configured) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        <p className="text-xs font-medium text-slate-200">Local storage only</p>
        <p className="mt-1 text-xs text-slate-400">Add Supabase env values to enable cloud sync.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking cloud sync status...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        <p className="text-xs font-medium text-slate-200">Cloud sync available</p>
        <p className="mt-1 text-xs text-slate-400">Sign in to store your data in Supabase as well as locally.</p>
        <Link
          href="/auth"
          className="mt-3 inline-flex rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-500"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-3">
      <p className="text-xs font-medium text-emerald-200">Cloud sync active</p>
      <p className="mt-1 break-all text-xs text-emerald-100">{email}</p>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200 transition hover:text-white disabled:opacity-70"
      >
        {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Sign out
      </button>
    </div>
  );
}
