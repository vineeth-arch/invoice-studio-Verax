"use client";

import Link from "next/link";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
  showCompanyProfileControls: boolean;
  hasSavedProfile: boolean;
  useCompanyProfile: boolean;
  companyName?: string;
  onUseCompanyProfileChange: (checked: boolean) => void;
}

export function POBuyerSection({
  control,
  register,
  errors,
  showCompanyProfileControls,
  hasSavedProfile,
  useCompanyProfile,
  companyName,
  onUseCompanyProfileChange,
}: Props) {
  return (
    <FormSection title="Supplier Details (FROM)">
      {showCompanyProfileControls && !hasSavedProfile ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div>Set up your company profile once and it auto-fills here every time.</div>
          <Link href="/company-profile" className="mt-2 inline-flex font-medium text-amber-950 underline underline-offset-2">
            Set up company profile →
          </Link>
        </div>
      ) : showCompanyProfileControls ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={useCompanyProfile}
              onChange={(event) => onUseCompanyProfileChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <div className="text-sm">
              <div className="font-medium text-slate-900">
                Use my company profile as FROM
              </div>
              {useCompanyProfile ? (
                <div className="text-slate-600">&quot;{companyName || "Saved company profile"}&quot;</div>
              ) : (
                <div className="text-slate-500">
                  Using custom supplier. Your saved profile is unchanged.
                </div>
              )}
            </div>
          </label>
          {useCompanyProfile && (
            <Link href="/company-profile" className="mt-2 inline-flex text-sm font-medium text-slate-700 underline underline-offset-2">
              Edit company profile →
            </Link>
          )}
        </div>
      ) : null}

      <fieldset disabled={showCompanyProfileControls && hasSavedProfile && useCompanyProfile} className={showCompanyProfileControls && hasSavedProfile && useCompanyProfile ? "space-y-0 opacity-60" : "space-y-0"}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Supplier Name" required error={errors.buyer?.name?.message} className="col-span-2">
            <input type="text" className={inputClass} {...register("buyer.name")} />
          </FormField>
          <FormField label="Address Line 1" required error={errors.buyer?.address?.line1?.message} className="col-span-2">
            <input type="text" className={inputClass} {...register("buyer.address.line1")} />
          </FormField>
          <FormField label="Address Line 2">
            <input type="text" className={inputClass} {...register("buyer.address.line2")} />
          </FormField>
          <FormField label="City" required><input type="text" className={inputClass} {...register("buyer.address.city")} /></FormField>
          <FormField label="State" required><input type="text" className={inputClass} {...register("buyer.address.state")} /></FormField>
          <FormField label="State Code" required><input type="text" className={inputClass} maxLength={2} {...register("buyer.stateCode")} /></FormField>
          <FormField label="Pincode" required><input type="text" className={inputClass} maxLength={6} {...register("buyer.address.pincode")} /></FormField>
          <FormField label="GSTIN" required error={errors.buyer?.gstin?.message} className="col-span-2">
            <Controller name="buyer.gstin" control={control} render={({ field }) => (
              <GSTINInput value={field.value} onChange={field.onChange} />
            )} />
          </FormField>
          <FormField label="Email"><input type="email" className={inputClass} {...register("buyer.contact.email")} /></FormField>
          <FormField label="Phone"><input type="tel" className={inputClass} {...register("buyer.contact.phone")} /></FormField>
        </div>
        <FormField label="Logo">
          <Controller name="buyer.logoImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload company logo" />
          )} />
        </FormField>
      </fieldset>
    </FormSection>
  );
}
