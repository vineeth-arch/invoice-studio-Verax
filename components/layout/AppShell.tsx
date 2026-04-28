"use client";

import { Sidebar } from "./Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { useEffect } from "react";
import { runMigrations } from "@/lib/storage/migrations";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    runMigrations();
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-60 min-h-screen">{children}</main>
      </div>
    </ToastProvider>
  );
}
