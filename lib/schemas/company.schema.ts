import { z } from "zod";

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  legalName: z.string().optional(),
  gstin: z.string().min(1, "GSTIN is required"),
  pan: z.string().optional(),
  address: z.object({
    line1: z.string().min(1, "Address is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    stateCode: z.string().min(1, "State code is required"),
    pincode: z.string().min(1, "Pincode is required"),
    country: z.string().default("India"),
  }),
  contact: z.object({
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().optional(),
  }),
  logoImageBase64: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    branch: z.string().optional(),
    ifscCode: z.string().optional(),
    upiId: z.string().optional(),
    paymentLink: z.string().optional(),
    upiQrImageBase64: z.string().optional(),
  }).optional(),
  defaultSignatoryName: z.string().optional(),
  defaultSignatureImageBase64: z.string().optional(),
  defaultTermsAndConditions: z.string().optional(),
  defaultDeclaration: z.string().optional(),
  defaultInvoicePrefix: z.string().optional(),
  defaultPOPrefix: z.string().optional(),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
