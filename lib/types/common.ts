export type GSTMode = "CGST_SGST" | "IGST" | "NO_TAX" | "CUSTOM";

export type DocumentStatus = "DRAFT" | "FINAL" | "PAID" | "CANCELLED";
export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Overdue";
export type POStatus = "Under Approval" | "Approved" | "Processed";

export interface Address {
  line1: string;
  line2?: string;
  floor?: string;
  unit?: string;
  building?: string;
  road?: string;
  landmark?: string;
  locality?: string;
  district?: string;
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
  branchName?: string;
  branchAddress?: string;
  ifscCode?: string;
  micrCode?: string;
  accountOpeningDate?: string;
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
