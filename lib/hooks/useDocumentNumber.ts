"use client";

import { useMemo } from "react";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { NumberingConfig } from "@/lib/types/settings";
import { generateDocumentNumber, getFinancialYear } from "@/lib/utils/numbering";

export function useDocumentNumber(
  config: NumberingConfig | undefined,
  existingDocs: Array<Invoice | PurchaseOrder>,
  currentId?: string
) {
  const fy = getFinancialYear();

  const suggested = useMemo(() => {
    if (!config) return "";
    return generateDocumentNumber(config, fy);
  }, [config, fy]);

  const isDuplicate = useMemo(() => {
    return (num: string) => {
      if (!num) return false;
      return existingDocs.some((doc) => {
        const docNum = "invoiceNumber" in doc ? doc.invoiceNumber : doc.poNumber;
        return docNum === num && doc.id !== currentId;
      });
    };
  }, [existingDocs, currentId]);

  return { suggested, isDuplicate, fy };
}
