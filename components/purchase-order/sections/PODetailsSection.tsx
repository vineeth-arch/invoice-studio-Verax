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

        <FormField label="Expected Delivery Date">
          <input type="date" className={inputClass} {...register("expectedDeliveryDate")} />
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

        <FormField label="PO Status">
          <select className={inputClass} {...register("poStatus")}>
            <option value="Under Approval">Under Approval</option>
            <option value="Approved">Approved</option>
            <option value="Processed">Processed</option>
          </select>
        </FormField>

        <FormField label="Payment Terms" required error={errors.paymentTerms?.message}>
          <input type="text" className={inputClass} placeholder="e.g. Net 30, Advance" {...register("paymentTerms")} />
        </FormField>

        <FormField label="Delivery Terms" required error={errors.deliveryTerms?.message}>
          <input type="text" className={inputClass} placeholder="e.g. FOR Destination" {...register("deliveryTerms")} />
        </FormField>

        <FormField label="Vendor Code">
          <input type="text" className={inputClass} {...register("vendor.vendorCode")} />
        </FormField>

        <FormField label="Quotation Reference">
          <input type="text" className={inputClass} {...register("quotationReference")} />
        </FormField>

        <FormField label="Quotation Date">
          <input type="date" className={inputClass} {...register("quotationDate")} />
        </FormField>

        <FormField label="Internal Requisition No.">
          <input type="text" className={inputClass} {...register("internalRequisitionNumber")} />
        </FormField>

        <FormField label="Project Name">
          <input type="text" className={inputClass} {...register("projectName")} />
        </FormField>

        <FormField label="Department / Cost Center">
          <input type="text" className={inputClass} {...register("department")} />
        </FormField>
      </div>
    </FormSection>
  );
}
