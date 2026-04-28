"use client";

import { useContext } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ToastContext, useToastState, type Toast, type ToastType } from "@/lib/hooks/useToast";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "var(--accent-mint)" }} />,
  error:   <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--accent-coral)" }} />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--accent-yellow)" }} />,
  info:    <Info className="h-4 w-4 shrink-0" style={{ color: "var(--accent-purple)" }} />,
};

const toastBorderColor: Record<ToastType, string> = {
  success: "var(--accent-mint)",
  error:   "var(--accent-coral)",
  warning: "var(--accent-yellow)",
  info:    "var(--accent-purple)",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3 shadow-xl min-w-[280px] max-w-sm animate-slide-in-bottom"
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${toastBorderColor[toast.type]}`,
      }}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="transition-colors hover:opacity-70 shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2 no-print">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = useToastState();
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
