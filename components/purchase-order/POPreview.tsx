import { DocumentTemplate } from "@/components/DocumentTemplate";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
  isGeneratingPDF?: boolean;
}

export function POPreview({ po, isGeneratingPDF = false }: POPreviewProps) {
  const from = po.buyer;
  const billTo = po.vendor;
  const totals = po.totals;
  const bankDetails = po.bankDetails;

  // These fields may be present at runtime but are not yet in the type
  const poExt = po as Partial<PurchaseOrder> & {
    validUntil?: string;
    deliveryDate?: string;
    placeOfSupply?: string;
    poReference?: string;
  };

  return (
    <DocumentTemplate
      documentType="purchase_order"
      status={po.status === "FINAL" ? "final" : "draft"}
      isGeneratingPDF={isGeneratingPDF}
      from={{
        logo: from?.logoImageBase64 ?? null,
        name: from?.name ?? "",
        address1: from?.address?.line1 ?? "",
        address2: from?.address?.line2 ?? "",
        city: from?.address?.city ?? "",
        state: from?.address?.state ?? "",
        pincode: from?.address?.pincode ?? "",
        gstin: from?.gstin ?? "",
        phone: from?.contact?.phone ?? "",
        email: from?.contact?.email ?? "",
      }}
      billTo={{
        name: billTo?.name ?? "",
        address1: billTo?.address?.line1 ?? "",
        address2: billTo?.address?.line2 ?? "",
        city: billTo?.address?.city ?? "",
        state: billTo?.address?.state ?? "",
        pincode: billTo?.address?.pincode ?? "",
        gstin: billTo?.gstin ?? null,
      }}
      docDetails={{
        number: po.poNumber ?? "",
        date: po.poDate ?? "",
        validUntil: poExt.validUntil,
        deliveryDate: poExt.deliveryDate ?? po.expectedDeliveryDate,
        poReference: poExt.poReference ?? po.quotationReference,
        projectDescription: po.projectDescription,
        placeOfSupply:
          poExt.placeOfSupply ??
          po.delivery?.address?.state ??
          billTo?.address?.state ??
          from?.address?.state ??
          "",
      }}
      lineItems={(po.lineItems ?? []).map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac ?? "",
        qty: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        gstPercent: item.gstRate,
        taxableAmount: item.taxableValue,
        cgst: item.taxAmount / 2,
        sgst: item.taxAmount / 2,
        igst: item.taxAmount,
        total: item.lineTotal,
      }))}
      totals={{
        subtotal: totals?.subtotal ?? 0,
        totalDiscount: totals?.totalDiscount ?? 0,
        taxableValue: totals?.totalTaxableValue ?? 0,
        cgst: 0,
        sgst: 0,
        igst: totals?.totalTax ?? 0,
        cess: 0,
        otherCharges: totals?.otherCharges ?? 0,
        grandTotal: totals?.grandTotal ?? 0,
        amountInWords: totals?.amountInWords ?? "",
        gstMode: "igst",
      }}
      bankDetails={
        bankDetails
          ? {
              accountName: bankDetails.accountName ?? "",
              bankName: bankDetails.bankName ?? "",
              accountNumber: bankDetails.accountNumber ?? "",
              ifsc: bankDetails.ifscCode ?? "",
              branch: bankDetails.branch ?? "",
              upiId: bankDetails.upiId ?? "",
            }
          : null
      }
      termsAndConditions={po.commercialTerms?.termsAndConditions ?? ""}
      notes={[
        po.paymentTerms ? `Payment Terms: ${po.paymentTerms}` : "",
        po.deliveryTerms ? `Delivery Terms: ${po.deliveryTerms}` : "",
        po.commercialTerms?.notes ?? "",
      ]
        .filter(Boolean)
        .join("\n")}
      signatory={{
        name: po.approvedBy ?? "",
        designation: po.approvedBySignature?.designation ?? "",
        signatureImage: po.approvedBySignature?.signatureImageBase64 ?? null,
      }}
      footer={{
        email: from?.contact?.email ?? "",
        phone: from?.contact?.phone ?? "",
        tagline: from?.name
          ? `${from.name} | Brand Identity, Packaging Design & Creative Consultancy`
          : "Brand Identity, Packaging Design & Creative Consultancy",
      }}
    />
  );
}
