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
      <div className="min-h-screen bg-theme-bg">
        <Sidebar />
        {/*
          margin-left follows --sidebar-width CSS variable, which the Sidebar
          updates on collapse/expand and which the media query zeros on mobile.
          The transition-[margin] keeps it smooth.
        */}
        <main
          className="min-h-screen transition-[margin-left] duration-300 pb-16 md:pb-0"
          style={{ marginLeft: "var(--sidebar-width)" }}
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
