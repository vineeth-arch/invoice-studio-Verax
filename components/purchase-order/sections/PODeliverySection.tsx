"use client";

import { useEffect, useState } from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";

interface Props {
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  vendorAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    pincode?: string;
  };
}

export function PODeliverySection({ register, errors, setValue, vendorAddress }: Props) {
  const [sameAsBilling, setSameAsBilling] = useState(true);

  useEffect(() => {
    if (sameAsBilling) {
      setValue("delivery.address.line1", vendorAddress?.line1 ?? "", { shouldDirty: true });
      setValue("delivery.address.line2", vendorAddress?.line2 ?? "", { shouldDirty: true });
      setValue("delivery.address.city", vendorAddress?.city ?? "", { shouldDirty: true });
      setValue("delivery.address.state", vendorAddress?.state ?? "", { shouldDirty: true });
      setValue("delivery.address.stateCode", vendorAddress?.stateCode ?? "", { shouldDirty: true });
      setValue("delivery.address.pincode", vendorAddress?.pincode ?? "", { shouldDirty: true });
      return;
    }

    setValue("delivery.address.line1", "", { shouldDirty: true });
    setValue("delivery.address.line2", "", { shouldDirty: true });
    setValue("delivery.address.city", "", { shouldDirty: true });
    setValue("delivery.address.state", "", { shouldDirty: true });
    setValue("delivery.address.stateCode", "", { shouldDirty: true });
    setValue("delivery.address.pincode", "", { shouldDirty: true });
  }, [sameAsBilling, setValue, vendorAddress]);

  return (
    <FormSection title="Delivery Details" defaultOpen={false}>
      <label className="mb-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={sameAsBilling}
          onChange={(event) => setSameAsBilling(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
        />
        <div className="text-sm">
          <div className="font-medium text-slate-900">Same as billing address (BILL TO)</div>
          <div className="text-slate-500">Use the BILL TO address for delivery details.</div>
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <fieldset disabled={sameAsBilling} className={sameAsBilling ? "col-span-2 contents opacity-60" : "col-span-2 contents"}>
          <FormField label="Address Line 1" required error={errors.delivery?.address?.line1?.message} className="col-span-2">
            <input type="text" className={inputClass} {...register("delivery.address.line1")} />
          </FormField>
          <FormField label="Address Line 2">
            <input type="text" className={inputClass} {...register("delivery.address.line2")} />
          </FormField>
          <FormField label="City" required><input type="text" className={inputClass} {...register("delivery.address.city")} /></FormField>
          <FormField label="State" required><input type="text" className={inputClass} {...register("delivery.address.state")} /></FormField>
          <FormField label="State Code"><input type="text" className={inputClass} maxLength={2} {...register("delivery.address.stateCode")} /></FormField>
          <FormField label="Pincode"><input type="text" className={inputClass} maxLength={6} {...register("delivery.address.pincode")} /></FormField>
        </fieldset>
        <FormField label="Contact Person"><input type="text" className={inputClass} {...register("delivery.contactPerson")} /></FormField>
        <FormField label="Contact Phone"><input type="tel" className={inputClass} {...register("delivery.contactPhone")} /></FormField>
        <FormField label="Mode of Dispatch"><input type="text" className={inputClass} placeholder="Road, Rail, Air..." {...register("delivery.modeOfDispatch")} /></FormField>
        <FormField label="Freight Terms"><input type="text" className={inputClass} placeholder="FOR, Ex-works..." {...register("delivery.freightTerms")} /></FormField>
      </div>
      <FormField label="Delivery Instructions">
        <textarea className={textareaClass} {...register("delivery.instructions")} />
      </FormField>
    </FormSection>
  );
}
