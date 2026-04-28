export type GSTMode = "CGST_SGST" | "IGST" | "NO_TAX" | "CUSTOM";

export type DocumentStatus = "DRAFT" | "FINAL" | "PAID" | "CANCELLED";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
}

export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  ifscCode?: string;
  upiId?: string;
  paymentLink?: string;
  upiQrImageBase64?: string;
}

export interface GSTSplit {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface SignatureInfo {
  signatoryName?: string;
  designation?: string;
  signatureImageBase64?: string;
}
