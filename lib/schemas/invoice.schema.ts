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
  hsnSac: z.string().min(1, "HSN/SAC is required"),
  quantity: z.preprocess(Number, z.number().positive("Quantity must be > 0")),
  unit: z.string().min(1, "Unit is required"),
  rate: z.preprocess(Number, z.number().min(0, "Rate must be ≥ 0")),
  discountPercent: z.preprocess(Number, z.number().min(0).max(100).default(0)),
  gstRate: z.preprocess(Number, z.number().min(0, "GST Rate must be ≥ 0")),
});

export const invoiceSchema = z.object({
  invoiceType: z.enum(["TAX_INVOICE", "BILL_OF_SUPPLY", "EXPORT_INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"]),
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

  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  declaration: z.string().optional(),

  signature: z.object({
    signatoryName: z.string().min(1, "Authorized signatory is required"),
    designation: z.string().optional(),
    signatureImageBase64: z.string().optional(),
  }),

  status: z.enum(["DRAFT", "FINAL", "PAID", "CANCELLED"]).default("DRAFT"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
