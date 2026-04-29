"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, inputClass } from "@/components/ui/FormField";
import { NumberingInput } from "@/components/ui/NumberingInput";

interface Props {
  control: Control<POFormValues>;
  register: UseFormRegister<POFormValues>;
  errors: FieldErrors<POFormValues>;
  isDuplicate: (num: string) => boolean;
}

export function PODetailsSection({ control, register, errors, isDuplicate }: Props) {
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

        <FormField label="Place of Supply" required error={errors.placeOfSupply?.message}>
          <input type="text" className={inputClass} placeholder="State name" {...register("placeOfSupply")} />
        </FormField>

        <FormField label="Place of Supply Code" required error={errors.placeOfSupplyCode?.message}>
          <input type="text" className={inputClass} placeholder="e.g. 27" maxLength={2} {...register("placeOfSupplyCode")} />
        </FormField>

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
