"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useToast } from "@/lib/hooks/useToast";
import type { CompanyProfileFormValues } from "@/lib/schemas/company.schema";
import { companyProfileSchema } from "@/lib/schemas/company.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { GSTINInput } from "@/components/ui/GSTINInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { Button } from "@/components/ui/Button";
import { getCodeByState, getStateByCode } from "@/lib/data/states";
import { v4 as uuidv4 } from "uuid";

export default function CompanyProfilePage() {
  const { profile, loading, saveProfile } = useCompanyProfile();
  const { addToast } = useToast();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: "", gstin: "",
      address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" },
      contact: {},
    },
  });

  useEffect(() => {
    if (profile) reset(profile as CompanyProfileFormValues);
  }, [profile, reset]);

  const onSubmit = async (values: CompanyProfileFormValues) => {
    const result = await saveProfile({
      ...values,
      id: profile?.id ?? uuidv4(),
      updatedAt: new Date().toISOString(),
    });
    if (result.success) addToast("Company profile saved successfully!", "success");
    else addToast(result.error ?? "Failed to save profile.", "error");
  };

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
        <p className="text-slate-500 text-sm">Your business details auto-fill into every invoice and purchase order.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <FormSection title="Business Information">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Display Brand Name" required error={errors.companyName?.message}>
              <input type="text" className={inputClass} {...register("companyName")} />
            </FormField>
            <FormField label="Trade / Business Name">
              <input type="text" className={inputClass} {...register("tradeName")} />
            </FormField>
            <FormField label="Display Brand Name (optional)">
              <input type="text" className={inputClass} {...register("displayBrandName")} />
            </FormField>
            <FormField label="Legal Name">
              <input type="text" className={inputClass} {...register("legalName")} />
            </FormField>
            <FormField label="Constitution">
              <input type="text" className={inputClass} {...register("constitution")} />
            </FormField>
            <FormField label="GSTIN" required error={errors.gstin?.message}>
              <Controller name="gstin" control={control} render={({ field }) => (
                <GSTINInput value={field.value} onChange={field.onChange} />
              )} />
            </FormField>
            <FormField label="Registration Type">
              <input type="text" className={inputClass} {...register("registrationType")} />
            </FormField>
            <FormField label="GST Registration Valid From">
              <input type="date" className={inputClass} {...register("gstRegistrationValidFrom")} />
            </FormField>
            <FormField label="PAN">
              <input type="text" className={inputClass} maxLength={10} {...register("pan")} />
            </FormField>
          </div>
          <FormField label="Company Logo">
            <Controller name="logoImageBase64" control={control} render={({ field }) => (
              <FileUpload value={field.value} onChange={field.onChange} label="Upload logo" />
            )} />
          </FormField>
        </FormSection>

        <FormSection title="Address">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Address Line 1" required error={errors.address?.line1?.message} className="col-span-2">
              <input type="text" className={inputClass} {...register("address.line1")} />
            </FormField>
            <FormField label="Address Line 2">
              <input type="text" className={inputClass} {...register("address.line2")} />
            </FormField>
            <FormField label="Floor">
              <input type="text" className={inputClass} {...register("address.floor")} />
            </FormField>
            <FormField label="Shop / Unit">
              <input type="text" className={inputClass} {...register("address.unit")} />
            </FormField>
            <FormField label="Premises / Building">
              <input type="text" className={inputClass} {...register("address.building")} />
            </FormField>
            <FormField label="Road">
              <input type="text" className={inputClass} {...register("address.road")} />
            </FormField>
            <FormField label="Landmark" className="col-span-2">
              <input type="text" className={inputClass} {...register("address.landmark")} />
            </FormField>
            <FormField label="Locality" className="col-span-2">
              <input type="text" className={inputClass} {...register("address.locality")} />
            </FormField>
            <FormField label="City" required><input type="text" className={inputClass} {...register("address.city")} /></FormField>
            <FormField label="District"><input type="text" className={inputClass} {...register("address.district")} /></FormField>
            <StateCodeInput
              stateValue={watch("address.state") ?? ""}
              stateCodeValue={watch("address.stateCode") ?? ""}
              onStateChange={(value) => {
                setValue("address.state", value);
                const code = getCodeByState(value);
                if (code) setValue("address.stateCode", code);
              }}
              onStateCodeChange={(value) => {
                setValue("address.stateCode", value);
                const name = getStateByCode(value);
                if (name) setValue("address.state", name);
              }}
              stateError={errors.address?.state?.message}
              stateCodeError={errors.address?.stateCode?.message}
              required
            />
            <FormField label="Pincode" required><input type="text" className={inputClass} maxLength={6} {...register("address.pincode")} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Contact Details">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email"><input type="email" className={inputClass} {...register("contact.email")} /></FormField>
            <FormField label="Phone"><input type="tel" className={inputClass} {...register("contact.phone")} /></FormField>
            <FormField label="Website" className="col-span-2"><input type="text" className={inputClass} {...register("contact.website")} /></FormField>
          </div>
        </FormSection>

        <FormSection title="Bank Details" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Bank Name"><input type="text" className={inputClass} {...register("bankDetails.bankName")} /></FormField>
            <FormField label="Account Holder Name"><input type="text" className={inputClass} {...register("bankDetails.accountName")} /></FormField>
            <FormField label="Account Number"><input type="text" className={inputClass} {...register("bankDetails.accountNumber")} /></FormField>
            <FormField label="Branch Name"><input type="text" className={inputClass} {...register("bankDetails.branchName")} /></FormField>
            <FormField label="IFSC Code"><input type="text" className={inputClass} {...register("bankDetails.ifscCode")} /></FormField>
            <FormField label="MICR Code"><input type="text" className={inputClass} {...register("bankDetails.micrCode")} /></FormField>
            <FormField label="Account Opening Date"><input type="date" className={inputClass} {...register("bankDetails.accountOpeningDate")} /></FormField>
            <FormField label="UPI ID"><input type="text" className={inputClass} {...register("bankDetails.upiId")} /></FormField>
            <FormField label="Payment Link"><input type="url" className={inputClass} {...register("bankDetails.paymentLink")} /></FormField>
            <FormField label="Branch / Short Name">
              <input type="text" className={inputClass} {...register("bankDetails.branch")} />
            </FormField>
          </div>
          <FormField label="Branch Address">
            <textarea className={textareaClass} {...register("bankDetails.branchAddress")} />
          </FormField>
          <FormField label="Payment QR Code">
            <Controller name="bankDetails.upiQrImageBase64" control={control} render={({ field }) => (
              <FileUpload value={field.value} onChange={field.onChange} label="Upload UPI QR code" />
            )} />
          </FormField>
        </FormSection>

        <FormSection title="Signature & Defaults" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Default Signatory Name" className="col-span-2">
              <input type="text" className={inputClass} {...register("defaultSignatoryName")} />
            </FormField>
            <FormField label="Default Invoice Prefix">
              <input type="text" className={inputClass} placeholder="INV" {...register("defaultInvoicePrefix")} />
            </FormField>
            <FormField label="Default PO Prefix">
              <input type="text" className={inputClass} placeholder="PO" {...register("defaultPOPrefix")} />
            </FormField>
          </div>
          <FormField label="Signature Image">
            <Controller name="defaultSignatureImageBase64" control={control} render={({ field }) => (
              <FileUpload value={field.value} onChange={field.onChange} label="Upload signature" />
            )} />
          </FormField>
          <FormField label="Default Terms & Conditions">
            <textarea className={textareaClass} {...register("defaultTermsAndConditions")} />
          </FormField>
          <FormField label="Default Declaration">
            <textarea className={textareaClass} {...register("defaultDeclaration")} />
          </FormField>
        </FormSection>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={isSubmitting}>Save Company Profile</Button>
        </div>
      </form>
    </div>
  );
}
