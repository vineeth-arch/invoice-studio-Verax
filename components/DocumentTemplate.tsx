{
  // Document meta
  documentType: "tax_invoice" | "bill_of_supply" |
    "export_invoice" | "credit_note" | "debit_note" |
    "purchase_order" | "proforma",
  status: "draft" | "final",
  isGeneratingPDF: boolean,

  // Column 1 — FROM (always = company/supplier)
  from: {
    logo: string | null,
    name: string,
    address1: string,
    address2: string,
    city: string,
    state: string,
    pincode: string,
    gstin: string,
    phone: string,
    email: string,
  },

  // Column 2 — BILL TO (always = client/vendor)
  billTo: {
    name: string,
    address1: string,
    address2: string,
    city: string,
    state: string,
    pincode: string,
    gstin: string | null,
  },

  // Column 3 — Document details
  docDetails: {
    number: string,
    date: string,
    dueDate?: string,
    validUntil?: string,
    deliveryDate?: string,
    poReference?: string,
    eWayBill?: string,
    projectDescription?: string,
    placeOfSupply: string,
  },

  // Line items
  lineItems: Array<{
    description: string,
    hsnSac: string,
    qty: number,
    unit: string,
    rate: number,
    discountPercent: number,
    gstPercent: number,
    taxableAmount: number,
    cgst: number,
    sgst: number,
    igst: number,
    total: number,
  }>,

  // Totals
  totals: {
    subtotal: number,
    totalDiscount: number,
    taxableValue: number,
    cgst: number,
    sgst: number,
    igst: number,
    cess: number,
    otherCharges: number,
    grandTotal: number,
    amountInWords: string,
    gstMode: "cgst_sgst" | "igst" | "none" | "custom",
  },

  // Bottom section
  bankDetails: {
    accountName: string,
    bankName: string,
    accountNumber: string,
    ifsc: string,
    branch?: string,
    upiId?: string,
  } | null,

  termsAndConditions: string,
  notes: string,
  declaration?: string,

  // Signatory
  signatory: {
    name: string,
    designation?: string,
    signatureImage?: string | null,
  },

  // Footer
  footer: {
    email: string,
    phone: string,
    tagline: string,
  },
}
