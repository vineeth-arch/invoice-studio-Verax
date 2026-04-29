import type { Address, ContactInfo, DocumentStatus, POStatus, SignatureInfo } from "./common";

export interface POLineItem {
  id: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number;
  // calculated
  gross: number;
  discountAmount: number;
  taxableValue: number;
  taxAmount: number;
  lineTotal: number;
}

export interface POTotals {
  subtotal: number;
  totalDiscount: number;
  totalTaxableValue: number;
  totalTax: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export interface POBuyerInfo {
  name: string;
  address: Address;
  gstin: string;
  stateCode: string;
  contact?: ContactInfo;
  logoImageBase64?: string;
}

export interface POVendorInfo {
  name: string;
  address: Address;
  gstin?: string;
  contactPerson?: string;
  contact?: ContactInfo;
  vendorCode?: string;
}

export interface PODeliveryInfo {
  address: Address;
  contactPerson?: string;
  contactPhone?: string;
  instructions?: string;
  modeOfDispatch?: string;
  freightTerms?: string;
  transportResponsibility?: string;
}

export interface POCommercialTerms {
  warrantyTerms?: string;
  inspectionTerms?: string;
  returnPolicy?: string;
  cancellationPolicy?: string;
  notes?: string;
  termsAndConditions?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  validUntil?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  projectDescription?: string;
  poReference?: string;
  placeOfSupply?: string;
  placeOfSupplyCode?: string;
  paymentTerms: string;
  deliveryTerms: string;
  quotationReference?: string;
  quotationDate?: string;
  internalRequisitionNumber?: string;
  projectName?: string;
  department?: string;
  buyer: POBuyerInfo;
  vendor: POVendorInfo;
  delivery: PODeliveryInfo;
  lineItems: POLineItem[];
  totals: POTotals;
  otherCharges: number;
  commercialTerms: POCommercialTerms;
  preparedBy?: string;
  approvedBy: string;
  preparedBySignature?: SignatureInfo;
  approvedBySignature?: SignatureInfo;
  vendorAcceptanceSignature?: SignatureInfo;
  poStatus: POStatus;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RawPOLineItem = Pick<
  POLineItem,
  "id" | "description" | "hsnSac" | "quantity" | "unit" | "rate" | "discountPercent" | "gstRate"
>;
