import type { GSTMode } from "./common";

export type DateFormat = "DD MMM YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

export interface GSTPlanningEntry {
  month: string;
  gstPaidToGovernment: number;
  gstPaidDate?: string;
  notes?: string;
  updatedAt?: string;
}

export interface NumberingConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  paddingLength: number;
  currentSequence: number;
}

export interface DocumentTemplateSettings {
  invoiceNumbering: NumberingConfig;
  poNumbering: NumberingConfig;
  defaultGSTMode: GSTMode;
  defaultCurrency: string;
  dateFormat: DateFormat;
  defaultNotes?: string;
  defaultTermsAndConditions?: string;
  defaultDeclaration?: string;
  showLogo: boolean;
  showSignature: boolean;
  showBankDetails: boolean;
  showQRCode: boolean;
  gstPlanningEntries: GSTPlanningEntry[];
  storedFinancialYear: string;
  updatedAt: string;
}
