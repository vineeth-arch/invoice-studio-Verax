"use client";

import Link from "next/link";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { getCodeByState, getStateByCode } from "@/lib/data/states";

interface Props {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  showCompanyProfileControls: boolean;
  hasSavedProfile: boolean;
  useCompanyProfile: boolean;
  companyName?: string;
  onUseCompanyProfileChange: (checked: boolean) => void;
}

export function SupplierDetailsSection({
  control,
  register,
  watch,
  setValue,
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
          <FormField label="Supplier Name" required error={errors.supplier?.name?.message} className="col-span-2">
            <input type="text" className={inputClass} placeholder="Your business name" {...register("supplier.name")} />
          </FormField>

          <FormField label="Address Line 1" required error={errors.supplier?.address?.line1?.message} className="col-span-2">
            <input type="text" className={inputClass} placeholder="Street, Building" {...register("supplier.address.line1")} />
          </FormField>

          <FormField label="Address Line 2">
            <input type="text" className={inputClass} placeholder="Area, Landmark (optional)" {...register("supplier.address.line2")} />
          </FormField>

          <FormField label="City" required error={errors.supplier?.address?.city?.message}>
            <input type="text" className={inputClass} {...register("supplier.address.city")} />
          </FormField>

          <StateCodeInput
            stateValue={watch("supplier.address.state") ?? ""}
            stateCodeValue={watch("supplier.stateCode") ?? ""}
            onStateChange={(value) => {
              setValue("supplier.address.state", value);
              const code = getCodeByState(value);
              if (code) {
                setValue("supplier.stateCode", code);
                setValue("supplier.address.stateCode", code);
              }
            }}
            onStateCodeChange={(value) => {
              setValue("supplier.stateCode", value);
              setValue("supplier.address.stateCode", value);
              const name = getStateByCode(value);
              if (name) setValue("supplier.address.state", name);
            }}
            stateError={errors.supplier?.address?.state?.message}
            stateCodeError={errors.supplier?.stateCode?.message}
            required
          />

          <FormField label="Pincode" required error={errors.supplier?.address?.pincode?.message}>
            <input type="text" className={inputClass} maxLength={6} {...register("supplier.address.pincode")} />
          </FormField>

          <FormField label="GSTIN" required error={errors.supplier?.gstin?.message} className="col-span-2">
            <Controller name="supplier.gstin" control={control} render={({ field }) => (
              <GSTINInput value={field.value} onChange={field.onChange} />
            )} />
          </FormField>

          <FormField label="PAN (optional)">
            <input type="text" className={inputClass} placeholder="AAAAA0000A" maxLength={10} {...register("supplier.pan")} />
          </FormField>

          <FormField label="Email">
            <input type="email" className={inputClass} {...register("supplier.contact.email")} />
          </FormField>

          <FormField label="Phone">
            <input type="tel" className={inputClass} {...register("supplier.contact.phone")} />
          </FormField>

          <FormField label="Website">
            <input type="text" className={inputClass} placeholder="https://..." {...register("supplier.contact.website")} />
          </FormField>
        </div>

        <FormField label="Logo">
          <Controller name="supplier.logoImageBase64" control={control} render={({ field }) => (
            <FileUpload value={field.value} onChange={field.onChange} label="Upload company logo" />
          )} />
        </FormField>
      </fieldset>
    </FormSection>
  );
}
