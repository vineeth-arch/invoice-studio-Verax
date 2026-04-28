import type { Address, ContactInfo, BankDetails } from "./common";

export interface BusinessProfile {
  id: string;
  companyName: string;
  legalName?: string;
  gstin: string;
  pan?: string;
  address: Address;
  contact: ContactInfo;
  logoImageBase64?: string;
  bankDetails?: BankDetails;
  defaultSignatoryName?: string;
  defaultSignatureImageBase64?: string;
  defaultTermsAndConditions?: string;
  defaultDeclaration?: string;
  defaultInvoicePrefix?: string;
  defaultPOPrefix?: string;
  updatedAt: string;
}
