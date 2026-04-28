"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { companyProfileRepository } from "@/lib/repositories/companyProfileRepository";
import { clientsRepository } from "@/lib/repositories/clientsRepository";
import { invoicesRepository } from "@/lib/repositories/invoicesRepository";
import { purchaseOrdersRepository } from "@/lib/repositories/purchaseOrdersRepository";
import { settingsRepository } from "@/lib/repositories/settingsRepository";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import * as local from "@/lib/storage/local";
import { useToast } from "@/lib/hooks/useToast";
import { useAuth } from "./AuthProvider";

export function AuthStatusCard() {
  const { configured, loading, user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncableData, setHasSyncableData] = useState(false);
  const { addToast } = useToast();
  const email = user?.email ?? "";

  useEffect(() => {
    if (!user) {
      setHasSyncableData(false);
      return;
    }

    const hasLocalData = Boolean(
      local.getCompanyProfile() ||
      local.getSavedClients().length ||
      local.getInvoices().length ||
      local.getPurchaseOrders().length
    );

    setHasSyncableData(hasLocalData);
  }, [user]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const results = await Promise.all([
        companyProfileRepository.syncLocalToCloud(),
        clientsRepository.syncLocalToCloud(),
        invoicesRepository.syncLocalToCloud(),
        purchaseOrdersRepository.syncLocalToCloud(),
        settingsRepository.syncLocalToCloud(),
        documentNumberingRepository.syncLocalToCloud(),
      ]);

      const failed = results.find((result) => !result.success);
      if (failed) {
        addToast(failed.error ?? "Some local data could not be synced to cloud.", "error");
        return;
      }

      setHasSyncableData(false);
      addToast("Local data synced to cloud successfully!", "success");
    } finally {
      setIsSyncing(false);
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
      {hasSyncableData ? (
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-70"
        >
          {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Sync local data to cloud
        </button>
      ) : (
        <p className="mt-3 text-xs text-emerald-200/80">Local and cloud storage are ready.</p>
      )}
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
