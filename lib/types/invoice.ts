import type { Address, ContactInfo, BankDetails, GSTMode, DocumentStatus, PaymentMode, PaymentStatus, SignatureInfo } from "./common";

export type InvoiceType =
  | "PROFORMA"
  | "TAX_INVOICE"
  | "BILL_OF_SUPPLY"
  | "EXPORT_INVOICE"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

export type DocumentType =
  | "proforma"
  | "tax_invoice"
  | "bill_of_supply"
  | "export_invoice"
  | "credit_note"
  | "debit_note";

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  PROFORMA: "Proforma Invoice",
  TAX_INVOICE: "Tax Invoice",
  BILL_OF_SUPPLY: "Bill of Supply",
  EXPORT_INVOICE: "Export Invoice",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
};

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number;
  // calculated
  gross: number;
  discountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  totalDiscount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  cess: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export interface CreditNoteReference {
  creditNoteId: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  creditAmount: number;
}

export interface SupplierInfo {
  name: string;
  address: Address;
  gstin: string;
  stateCode: string;
  contact: ContactInfo;
  pan?: string;
  logoImageBase64?: string;
}

export interface BuyerInfo {
  name: string;
  billingAddress: Address;
  gstin?: string;
  contact?: ContactInfo;
  placeOfSupply: string;
  placeOfSupplyCode: string;
}

export interface ShippingInfo {
  sameAsBilling: boolean;
  name?: string;
  address?: Address;
  contactPerson?: string;
  contactPhone?: string;
}

export interface Invoice {
  id: string;
  documentType: DocumentType;
  invoiceType: InvoiceType;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poReference?: string;
  projectDescription?: string;
  ewayBillNumber?: string;
  reverseCharge: boolean;
  irnNumber?: string;
  irnQrImageBase64?: string;
  supplier: SupplierInfo;
  buyer: BuyerInfo;
  shipping: ShippingInfo;
  gstMode: GSTMode;
  lineItems: InvoiceLineItem[];
  totals: InvoiceTotals;
  cess: number;
  otherCharges: number;
  paymentDetails?: BankDetails;
  paymentStatus: PaymentStatus;
  tdsApplicable: boolean;
  tdsSection: string;
  tdsRate: number;
  tdsAmount: number;
  paymentReceivedAmount: number;
  paymentReceivedDate?: string;
  tdsDeducted: number;
  netReceived: number;
  paymentMode?: PaymentMode;
  transactionReference?: string;
  creditNoteRefs: CreditNoteReference[];
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  linkedInvoiceDate?: string;
  creditReason?: string;
  shareToken?: string;
  notes?: string;
  termsAndConditions?: string;
  declaration?: string;
  signature: SignatureInfo;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RawInvoiceLineItem = Pick<
  InvoiceLineItem,
  "id" | "description" | "hsnSac" | "quantity" | "unit" | "rate" | "discountPercent" | "gstRate"
>;
