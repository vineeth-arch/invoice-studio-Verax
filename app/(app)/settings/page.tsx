"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useEmailSettings } from "@/lib/hooks/useEmailSettings";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import type { EmailSettings } from "@/lib/types/email";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { generateDocumentNumber } from "@/lib/utils/numbering";

export default function SettingsPage() {
  const { settings, loading, saveSettings } = useSettings();
  const { profile } = useCompanyProfile();
  const { settings: emailSettings, loading: emailLoading, saveSettings: saveEmailSettings } = useEmailSettings(profile?.companyName);
  const { addToast } = useToast();
  const [emailForm, setEmailForm] = useState<EmailSettings>({ fromName: "", fromEmail: "", emailSignature: "" });

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm<DocumentTemplateSettings>();

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  useEffect(() => {
    setEmailForm(emailSettings);
  }, [emailSettings]);

  const watched = watch();
  const previewInvoice = watched.invoiceNumbering
    ? generateDocumentNumber(watched.invoiceNumbering, watched.storedFinancialYear || "26")
    : "";
  const previewPO = watched.poNumbering
    ? generateDocumentNumber(watched.poNumbering, watched.storedFinancialYear || "26")
    : "";

  const onSubmit = async (values: DocumentTemplateSettings) => {
    const result = await saveSettings(values);
    if (result.success) addToast("Settings saved!", "success");
    else addToast(result.error ?? "Failed to save settings.", "error");
  };

  const handleEmailSubmit = async () => {
    const result = await saveEmailSettings(emailForm);
    if (result.success) addToast("Email settings saved!", "success");
    else addToast(result.error ?? "Failed to save email settings.", "error");
  };

  if (loading || emailLoading) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Configure defaults for your documents</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <FormSection title="Invoice Numbering">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Prefix">
              <input type="text" className={inputClass} {...register("invoiceNumbering.prefix")} />
            </FormField>
            <FormField label="Separator">
              <input type="text" className={inputClass} maxLength={1} {...register("invoiceNumbering.separator")} />
            </FormField>
            <FormField label="Padding (digits)">
              <input type="number" min={1} max={8} className={inputClass} {...register("invoiceNumbering.paddingLength", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Current Sequence">
              <input type="number" min={1} className={inputClass} {...register("invoiceNumbering.currentSequence", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Include FY Year" className="col-span-2">
              <select className={selectClass} {...register("invoiceNumbering.includeYear", { setValueAs: (v) => v === "true" || v === true })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </FormField>
          </div>
          {previewInvoice && <p className="text-xs text-slate-500 mt-1">Preview: <strong>{previewInvoice}</strong></p>}
        </FormSection>

        <FormSection title="Purchase Order Numbering">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Prefix">
              <input type="text" className={inputClass} {...register("poNumbering.prefix")} />
            </FormField>
            <FormField label="Separator">
              <input type="text" className={inputClass} maxLength={1} {...register("poNumbering.separator")} />
            </FormField>
            <FormField label="Padding (digits)">
              <input type="number" min={1} max={8} className={inputClass} {...register("poNumbering.paddingLength", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Current Sequence">
              <input type="number" min={1} className={inputClass} {...register("poNumbering.currentSequence", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Include FY Year" className="col-span-2">
              <select className={selectClass} {...register("poNumbering.includeYear", { setValueAs: (v) => v === "true" || v === true })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </FormField>
          </div>
          {previewPO && <p className="text-xs text-slate-500 mt-1">Preview: <strong>{previewPO}</strong></p>}
        </FormSection>

        <FormSection title="Document Defaults">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Default GST Mode">
              <select className={selectClass} {...register("defaultGSTMode")}>
                <option value="CGST_SGST">CGST + SGST (Intra-state)</option>
                <option value="IGST">IGST (Inter-state)</option>
                <option value="NO_TAX">No Tax</option>
              </select>
            </FormField>
            <FormField label="Date Format">
              <select className={selectClass} {...register("dateFormat")}>
                <option value="DD MMM YYYY">DD MMM YYYY (e.g. 28 Apr 2026)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Document Display Options">
          <div className="space-y-2">
            {[
              { name: "showLogo" as const, label: "Show logo in documents" },
              { name: "showSignature" as const, label: "Show signature section" },
              { name: "showBankDetails" as const, label: "Show bank/payment details" },
              { name: "showQRCode" as const, label: "Show payment QR code" },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  {...register(name)} />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </FormSection>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={isSubmitting}>Save Settings</Button>
        </div>
      </form>

      <div className="mt-8">
        <FormSection title="Email Settings">
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Configure how emails are sent from this app</p>
            <FormField
              label="Sender Name"
              hint="Name shown in recipient's inbox"
            >
              <input
                type="text"
                className={inputClass}
                value={emailForm.fromName}
                onChange={(event) => setEmailForm((current) => ({ ...current, fromName: event.target.value }))}
                placeholder="Design Innsaeit"
              />
            </FormField>
            <FormField
              label="Sender Email"
              hint="Verify this email in Resend dashboard for best deliverability"
            >
              <input
                type="email"
                className={inputClass}
                value={emailForm.fromEmail}
                onChange={(event) => setEmailForm((current) => ({ ...current, fromEmail: event.target.value }))}
                placeholder="vineeth@designinnsaeit.com"
              />
            </FormField>
            <FormField label="Email Signature">
              <textarea
                className={textareaClass}
                rows={3}
                value={emailForm.emailSignature}
                onChange={(event) => setEmailForm((current) => ({ ...current, emailSignature: event.target.value }))}
                placeholder={"Regards,\nVineeth V Nair\nDesign Innsaeit"}
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void handleEmailSubmit()}>
                Save Email Settings
              </Button>
            </div>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
