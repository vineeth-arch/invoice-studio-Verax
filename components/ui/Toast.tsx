"use client";

import { useContext } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ToastContext, useToastState, type Toast, type ToastType } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils/cn";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 shadow-md min-w-[280px] max-w-sm",
        toastStyles[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-slate-800">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 no-print">
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
