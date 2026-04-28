import { cn } from "@/lib/utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

export const selectClass =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 " +
  "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white";

export const textareaClass =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y min-h-[80px]";
