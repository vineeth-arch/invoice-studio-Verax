"use client";

import type { Control, UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { NumberingInput } from "@/components/ui/NumberingInput";
import { StateCodeInput } from "@/components/ui/StateCodeInput";
import { getCodeByState, getStateByCode } from "@/lib/data/states";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  watch: UseFormWatch<POFormValues>;
  setValue: UseFormSetValue<POFormValues>;
  errors: FieldErrors<POFormValues>;
  isDuplicate: (num: string) => boolean;
}

export function PODetailsSection({ control, register, watch, setValue, errors, isDuplicate }: Props) {
  return (
    <FormSection title="PO Details">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO Number" required error={errors.poNumber?.message}>
          <Controller name="poNumber" control={control} render={({ field }) => (
            <NumberingInput {...field} isDuplicate={isDuplicate(field.value)} />
          )} />
        </FormField>

        <FormField label="PO Date" required error={errors.poDate?.message}>
          <input type="date" className={inputClass} {...register("poDate")} />
        </FormField>

        <FormField label="Valid Until">
          <input type="date" className={inputClass} {...register("validUntil")} />
        </FormField>

        <FormField label="Delivery Date">
          <input type="date" className={inputClass} {...register("deliveryDate")} />
        </FormField>

        <FormField label="PO Reference">
          <input type="text" className={inputClass} placeholder="PO-REF-001" {...register("poReference")} />
        </FormField>

        <FormField label="Project Description (optional)" error={errors.projectDescription?.message}>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Brand identity design consultancy for ABC Foods"
            maxLength={120}
            {...register("projectDescription")}
          />
        </FormField>

        <StateCodeInput
          stateValue={watch("placeOfSupply") ?? ""}
          stateCodeValue={watch("placeOfSupplyCode") ?? ""}
          onStateChange={(value) => {
            setValue("placeOfSupply", value);
            const code = getCodeByState(value);
            if (code) setValue("placeOfSupplyCode", code);
          }}
          onStateCodeChange={(value) => {
            setValue("placeOfSupplyCode", value);
            const name = getStateByCode(value);
            if (name) setValue("placeOfSupply", name);
          }}
          stateError={errors.placeOfSupply?.message}
          stateCodeError={errors.placeOfSupplyCode?.message}
          stateLabel="Place of Supply"
          stateCodeLabel="Place of Supply Code"
          required
        />

        <FormField label="Payment Terms" required error={errors.paymentTerms?.message}>
          <input type="text" className={inputClass} placeholder="e.g. Net 30, Advance" {...register("paymentTerms")} />
        </FormField>

        <FormField label="Delivery Terms" required error={errors.deliveryTerms?.message}>
          <input type="text" className={inputClass} placeholder="e.g. FOR Destination" {...register("deliveryTerms")} />
        </FormField>
      </div>
    </FormSection>
  );
}
