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
      <label
        className="block text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
        {required && <span className="ml-0.5" style={{ color: "var(--accent-coral)" }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--accent-coral)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* Shared input/select/textarea class strings — used by form section components.
   The `di-field` class (in globals.css) applies theme-aware bg/text/border via CSS variables. */
export const inputClass =
  "di-field block w-full rounded-xl border px-3 py-2.5 text-sm transition-colors " +
  "focus:outline-none";

export const inputStyle = {
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
} as React.CSSProperties;

export const selectClass = inputClass;
export const selectStyle = inputStyle;

export const textareaClass =
  "di-field block w-full rounded-xl border px-3 py-2.5 text-sm transition-colors resize-y min-h-[80px] " +
  "focus:outline-none";
export const textareaStyle = inputStyle;
