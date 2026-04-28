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

const poLineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  hsnSac: z.string().optional(),
  quantity: z.preprocess(Number, z.number().positive("Quantity must be > 0")),
  unit: z.string().min(1, "Unit is required"),
  rate: z.preprocess(Number, z.number().min(0, "Rate must be ≥ 0")),
  discountPercent: z.preprocess(Number, z.number().min(0).max(100).default(0)),
  gstRate: z.preprocess(Number, z.number().min(0, "GST Rate must be ≥ 0")),
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  poDate: z.string().min(1, "PO date is required"),
  expectedDeliveryDate: z.string().optional(),
  projectDescription: z.string().max(120, "Project description must be ≤ 120 characters").optional(),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  deliveryTerms: z.string().min(1, "Delivery terms are required"),
  quotationReference: z.string().optional(),
  quotationDate: z.string().optional(),
  internalRequisitionNumber: z.string().optional(),
  projectName: z.string().optional(),
  department: z.string().optional(),

  buyer: z.object({
    name: z.string().min(1, "Buyer name is required"),
    address: addressSchema,
    gstin: z.string().min(1, "Buyer GSTIN is required"),
    stateCode: z.string().min(1, "State code is required"),
    contact: contactSchema.optional(),
    logoImageBase64: z.string().optional(),
  }),

  vendor: z.object({
    name: z.string().min(1, "Supplier name is required"),
    address: addressSchema,
    gstin: z.string().optional(),
    contactPerson: z.string().optional(),
    contact: contactSchema.optional(),
    vendorCode: z.string().optional(),
  }),

  delivery: z.object({
    address: addressSchema,
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    instructions: z.string().optional(),
    modeOfDispatch: z.string().optional(),
    freightTerms: z.string().optional(),
    transportResponsibility: z.string().optional(),
  }),

  lineItems: z.array(poLineItemSchema).min(1, "At least one line item is required"),
  otherCharges: z.preprocess(Number, z.number().min(0).default(0)),

  commercialTerms: z.object({
    warrantyTerms: z.string().optional(),
    inspectionTerms: z.string().optional(),
    returnPolicy: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
  }),

  preparedBy: z.string().optional(),
  approvedBy: z.string().min(1, "Approved by is required"),

  preparedBySignature: z.object({
    signatoryName: z.string().optional(),
    designation: z.string().optional(),
    signatureImageBase64: z.string().optional(),
  }).optional(),

  approvedBySignature: z.object({
    signatoryName: z.string().optional(),
    designation: z.string().optional(),
    signatureImageBase64: z.string().optional(),
  }).optional(),

  vendorAcceptanceSignature: z.object({
    signatoryName: z.string().optional(),
    designation: z.string().optional(),
    signatureImageBase64: z.string().optional(),
  }).optional(),

  poStatus: z.enum(["Under Approval", "Approved", "Processed"]).default("Under Approval"),
  status: z.enum(["DRAFT", "FINAL", "PAID", "CANCELLED"]).default("DRAFT"),
});

export type POFormValues = z.infer<typeof purchaseOrderSchema>;
