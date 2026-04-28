"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";

interface Props {
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
}

export function PODeliverySection({ register, errors }: Props) {
  return (
    <FormSection title="Delivery Details" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
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
