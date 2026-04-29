"use client";

import type { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { getCodeByState, getStateByCode } from "@/lib/data/states";

interface Props {
  register: UseFormRegister<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
}

export function ShippingDetailsSection({ register, watch, setValue }: Props) {
  const sameAsBilling = watch("shipping.sameAsBilling");

  return (
    <FormSection title="Shipping / Delivery Details" defaultOpen={false}>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          id="sameAsBilling"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={sameAsBilling}
          onChange={(e) => setValue("shipping.sameAsBilling", e.target.checked)}
        />
        <label htmlFor="sameAsBilling" className="text-sm text-slate-600">Same as billing address</label>
      </div>

      {!sameAsBilling && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ship-to Name" className="col-span-2">
            <input type="text" className={inputClass} {...register("shipping.name")} />
          </FormField>
          <FormField label="Address Line 1" className="col-span-2">
            <input type="text" className={inputClass} {...register("shipping.address.line1")} />
          </FormField>
          <FormField label="Address Line 2">
            <input type="text" className={inputClass} {...register("shipping.address.line2")} />
          </FormField>
          <FormField label="City">
            <input type="text" className={inputClass} {...register("shipping.address.city")} />
          </FormField>
          <StateCodeInput
            stateValue={watch("shipping.address.state") ?? ""}
            stateCodeValue={watch("shipping.address.stateCode") ?? ""}
            onStateChange={(value) => {
              setValue("shipping.address.state", value);
              const code = getCodeByState(value);
              if (code) setValue("shipping.address.stateCode", code);
            }}
            onStateCodeChange={(value) => {
              setValue("shipping.address.stateCode", value);
              const name = getStateByCode(value);
              if (name) setValue("shipping.address.state", name);
            }}
          />
          <FormField label="Pincode">
            <input type="text" className={inputClass} maxLength={6} {...register("shipping.address.pincode")} />
          </FormField>
          <FormField label="Contact Person">
            <input type="text" className={inputClass} {...register("shipping.contactPerson")} />
          </FormField>
          <FormField label="Contact Phone">
            <input type="tel" className={inputClass} {...register("shipping.contactPhone")} />
          </FormField>
        </div>
      )}
    </FormSection>
  );
}
