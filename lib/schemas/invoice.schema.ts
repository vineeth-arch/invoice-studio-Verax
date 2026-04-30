import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  stateCode: z.string().min(1, "State code is required"),
  pincode: z.string().min(1, "Pincode is required"),
  country: z.string().default("India"),
});

const contactSchema = z.object({
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
});

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  hsnSac: z.string().default(""),
  quantity: z.preprocess(Number, z.number().positive("Quantity must be > 0")),
  unit: z.string().min(1, "Unit is required"),
  rate: z.preprocess(Number, z.number()),
  discountPercent: z.preprocess(Number, z.number().min(0).max(100).default(0)),
  gstRate: z.preprocess(Number, z.number().min(0, "GST Rate must be ≥ 0")),
});

export const invoiceSchema = z.object({
  invoiceType: z.enum(["PROFORMA", "TAX_INVOICE", "BILL_OF_SUPPLY", "EXPORT_INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"]),
  invoiceNumber: z
    .string()
    .min(1, "Invoice number is required")
    .max(16, "Invoice number must be ≤ 16 characters")
    .regex(/^[A-Za-z0-9\/\-]+$/, "Only letters, numbers, / and - are allowed"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional(),
  poReference: z.string().optional(),
  projectDescription: z.string().max(120, "Project description must be ≤ 120 characters").optional(),
  ewayBillNumber: z.string().optional(),
  reverseCharge: z.boolean().default(false),
  irnNumber: z.string().optional(),
  irnQrImageBase64: z.string().optional(),

  supplier: z.object({
    name: z.string().min(1, "Supplier name is required"),
    address: addressSchema,
    gstin: z.string().min(1, "Supplier GSTIN is required"),
    stateCode: z.string().min(1, "State code is required"),
    contact: contactSchema,
    pan: z.string().optional(),
    logoImageBase64: z.string().optional(),
  }),

  buyer: z.object({
    name: z.string().min(1, "Buyer name is required"),
    billingAddress: addressSchema,
    gstin: z.string().optional(),
    contact: contactSchema.optional(),
    placeOfSupply: z.string().min(1, "Place of supply is required"),
    placeOfSupplyCode: z.string().min(1, "Place of supply code is required"),
  }),

  shipping: z.object({
    sameAsBilling: z.boolean().default(true),
    name: z.string().optional(),
    address: addressSchema.partial().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
  }),

  gstMode: z.enum(["CGST_SGST", "IGST", "NO_TAX", "CUSTOM"]),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),

  cess: z.preprocess(Number, z.number().min(0).default(0)),
  otherCharges: z.preprocess(Number, z.number().min(0).default(0)),

  paymentDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    branch: z.string().optional(),
    ifscCode: z.string().optional(),
    upiId: z.string().optional(),
    paymentLink: z.string().optional(),
    upiQrImageBase64: z.string().optional(),
  }).optional(),
  paymentStatus: z.enum(["Unpaid", "Partial", "Paid", "Overdue"]).default("Unpaid"),
  baseClearedAmount: z.preprocess(Number, z.number().min(0).default(0)),
  baseClearedDate: z.string().optional(),
  gstCollectionMode: z.enum(["standard", "deferred"]).default("standard"),
  gstCleared: z.boolean().default(false),
  gstClearedAmount: z.preprocess(Number, z.number().min(0).default(0)),
  gstClearedDate: z.string().optional(),
  invoiceClearedDate: z.string().optional(),
  settlementNotes: z.string().max(300, "Settlement notes must be ≤ 300 characters").optional(),
  tdsApplicable: z.boolean().default(false),
  tdsSection: z.string().default("194J"),
  tdsRate: z.preprocess(Number, z.number().min(0).default(10)),
  tdsAmount: z.preprocess(Number, z.number().min(0).default(0)),
  paymentReceivedAmount: z.preprocess(Number, z.number().min(0).default(0)),
  paymentReceivedDate: z.string().optional(),
  tdsDeducted: z.preprocess(Number, z.number().min(0).default(0)),
  netReceived: z.preprocess(Number, z.number().min(0).default(0)),
  paymentMode: z.enum(["Cash", "NEFT", "RTGS", "UPI", "Cheque"]).optional(),
  transactionReference: z.string().optional(),
  creditNoteRefs: z.array(z.object({
    creditNoteId: z.string(),
    creditNoteNumber: z.string(),
    creditNoteDate: z.string(),
    creditAmount: z.preprocess(Number, z.number()),
  })).default([]),
  linkedInvoiceId: z.string().optional(),
  linkedInvoiceNumber: z.string().optional(),
  linkedInvoiceDate: z.string().optional(),
  creditReason: z.string().optional(),

  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  declaration: z.string().optional(),

  signature: z.object({
    signatoryName: z.string().min(1, "Authorized signatory is required"),
    designation: z.string().optional(),
    signatureImageBase64: z.string().optional(),
  }),

  status: z.enum(["DRAFT", "FINAL", "PAID", "CANCELLED"]).default("DRAFT"),
}).superRefine((value, ctx) => {
  if (value.invoiceType === "PROFORMA") return;

  value.lineItems.forEach((item, index) => {
    if (!item.hsnSac?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lineItems", index, "hsnSac"],
        message: "HSN/SAC is required",
      });
    }
  });

  if (value.invoiceType === "CREDIT_NOTE") {
    if (!value.linkedInvoiceId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["linkedInvoiceId"],
        message: "Original invoice reference is required",
      });
    }

    if (!value.creditReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditReason"],
        message: "Credit reason is required",
      });
    }

    value.lineItems.forEach((item, index) => {
      if ((Number(item.rate) || 0) >= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lineItems", index, "rate"],
          message: "Use a negative rate for credited items",
        });
      }
    });
    return;
  }

  value.lineItems.forEach((item, index) => {
    if ((Number(item.rate) || 0) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lineItems", index, "rate"],
        message: "Rate must be 0 or more",
      });
    }
  });

  const gstAmount = value.gstMode === "NO_TAX"
    ? 0
    : value.lineItems.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const discountPercent = Number(item.discountPercent) || 0;
        const gross = quantity * rate;
        const taxable = gross - (gross * discountPercent) / 100;
        const taxAmount = taxable * ((Number(item.gstRate) || 0) / 100);
        return sum + taxAmount;
      }, 0);

  if (value.gstClearedAmount > Number(gstAmount.toFixed(2)) && value.gstMode !== "NO_TAX") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gstClearedAmount"],
      message: "GST cleared amount cannot exceed GST amount on the invoice",
    });
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
