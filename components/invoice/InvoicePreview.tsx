import { DocumentTemplate } from "@/components/DocumentTemplate";
import type { Invoice } from "@/lib/types/invoice";
import {
  getDisplayInvoiceNumber,
  isProformaInvoice,
  resolveInvoiceType,
} from "@/lib/utils/invoiceTypes";

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
  isGeneratingPDF?: boolean;
}

function normalizeInvoiceDocumentType(invoice: Partial<Invoice>) {
  if (isProformaInvoice(invoice)) return "proforma" as const;
  switch (resolveInvoiceType(invoice)) {
    case "BILL_OF_SUPPLY":
      return "bill_of_supply" as const;
    case "EXPORT_INVOICE":
      return "export_invoice" as const;
    case "CREDIT_NOTE":
      return "credit_note" as const;
    case "DEBIT_NOTE":
      return "debit_note" as const;
    default:
      return "tax_invoice" as const;
  }
}

function normalizeGSTMode(mode?: Invoice["gstMode"]) {
  switch (mode) {
    case "IGST":
      return "igst" as const;
    case "NO_TAX":
      return "none" as const;
    case "CUSTOM":
      return "custom" as const;
    default:
      return "cgst_sgst" as const;
  }
}

export function InvoicePreview({ invoice, isGeneratingPDF = false }: InvoicePreviewProps) {
  const documentType = normalizeInvoiceDocumentType(invoice);
  const supplier = invoice.supplier;
  const buyer = invoice.buyer;
  const totals = invoice.totals;
  const paymentDetails = invoice.paymentDetails;
  const signature = invoice.signature;

  const hasBankData = Boolean(
    paymentDetails?.accountName ||
      paymentDetails?.accountNumber ||
      paymentDetails?.bankName ||
      paymentDetails?.ifscCode
  );

  const resolvedBankDetails = hasBankData
    ? {
        accountName: paymentDetails?.accountName ?? "",
        bankName: paymentDetails?.bankName ?? "",
        accountNumber: paymentDetails?.accountNumber ?? "",
        ifsc: paymentDetails?.ifscCode ?? "",
        branch: paymentDetails?.branch ?? "",
        upiId: paymentDetails?.upiId ?? "",
      }
    : null;
  return (
    <DocumentTemplate
      documentType={documentType}
      status={invoice.status === "FINAL" ? "final" : "draft"}
      isGeneratingPDF={isGeneratingPDF}
      from={{
        logo: supplier?.logoImageBase64 ?? null,
        name: supplier?.name ?? "",
        address1: supplier?.address?.line1 ?? "",
        address2: supplier?.address?.line2 ?? "",
        city: supplier?.address?.city ?? "",
        state: supplier?.address?.state ?? "",
        pincode: supplier?.address?.pincode ?? "",
        gstin: supplier?.gstin ?? "",
        phone: supplier?.contact?.phone ?? "",
        email: supplier?.contact?.email ?? "",
      }}
      billTo={{
        name: buyer?.name ?? "",
        address1: buyer?.billingAddress?.line1 ?? "",
        address2: buyer?.billingAddress?.line2 ?? "",
        city: buyer?.billingAddress?.city ?? "",
        state: buyer?.billingAddress?.state ?? "",
        pincode: buyer?.billingAddress?.pincode ?? "",
        gstin: documentType === "proforma" ? null : buyer?.gstin ?? null,
      }}
      docDetails={{
        number: getDisplayInvoiceNumber(invoice),
        date: invoice.invoiceDate ?? "",
        dueDate: invoice.dueDate,
        poReference: invoice.poReference,
        eWayBill: invoice.ewayBillNumber,
        projectDescription: invoice.projectDescription,
        placeOfSupply: buyer?.placeOfSupply ?? "",
      }}
      lineItems={(invoice.lineItems ?? []).map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac,
        qty: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        gstPercent: item.gstRate,
        taxableAmount: item.taxableValue,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total: documentType === "proforma" ? item.taxableValue : item.lineTotal,
      }))}
      totals={{
        subtotal: totals?.subtotal ?? 0,
        totalDiscount: totals?.totalDiscount ?? 0,
        taxableValue: totals?.totalTaxableValue ?? totals?.subtotal ?? 0,
        cgst: totals?.totalCGST ?? 0,
        sgst: totals?.totalSGST ?? 0,
        igst: totals?.totalIGST ?? 0,
        cess: totals?.cess ?? 0,
        otherCharges: totals?.otherCharges ?? 0,
        grandTotal: totals?.grandTotal ?? 0,
        amountInWords: totals?.amountInWords ?? "",
        gstMode: normalizeGSTMode(invoice.gstMode),
      }}
      bankDetails={resolvedBankDetails}
      bankDetails={resolvedBankDetails}
      termsAndConditions={invoice.termsAndConditions ?? ""}
      notes={invoice.notes ?? ""}
      declaration={invoice.declaration}
      signatory={{
        name: signature?.signatoryName ?? "",
        designation: signature?.designation ?? "",
        signatureImage: signature?.signatureImageBase64 ?? null,
      }}
      footer={{
        email: supplier?.contact?.email ?? "",
        phone: supplier?.contact?.phone ?? "",
        tagline: supplier?.name
          ? `${supplier.name} | Brand Identity, Packaging Design & Creative Consultancy`
          : "Brand Identity, Packaging Design & Creative Consultancy",
        tagline: supplier?.name
          ? `${supplier.name} | Brand Identity, Packaging Design & Creative Consultancy`
          : "Brand Identity, Packaging Design & Creative Consultancy",
      }}
    />
  );
}
