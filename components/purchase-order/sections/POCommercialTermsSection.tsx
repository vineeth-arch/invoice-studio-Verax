"use client";

import type { UseFormRegister } from "react-hook-form";
import type { POFormValues } from "@/lib/schemas/purchase-order.schema";
import { FormSection } from "@/components/ui/FormSection";
import { FormField, textareaClass } from "@/components/ui/FormField";

interface Props {
  register: UseFormRegister<POFormValues>;
}

export function POCommercialTermsSection({ register }: Props) {
  return (
    <FormSection title="Commercial Terms" defaultOpen={false}>
      <FormField label="Notes">
        <textarea className={textareaClass} {...register("commercialTerms.notes")} />
      </FormField>
      <FormField label="Terms & Conditions">
        <textarea className={textareaClass} {...register("commercialTerms.termsAndConditions")} />
      </FormField>
      <FormField label="Warranty Terms">
        <textarea className={textareaClass} {...register("commercialTerms.warrantyTerms")} />
      </FormField>
      <FormField label="Inspection / Approval Conditions">
        <textarea className={textareaClass} {...register("commercialTerms.inspectionTerms")} />
      </FormField>
      <FormField label="Return / Rejection Policy">
        <textarea className={textareaClass} {...register("commercialTerms.returnPolicy")} />
      </FormField>
      <FormField label="Cancellation Terms">
        <textarea className={textareaClass} {...register("commercialTerms.cancellationPolicy")} />
      </FormField>
    </FormSection>
  );
}
