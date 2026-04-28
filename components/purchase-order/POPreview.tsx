import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";
import { BrandedA4Template } from "@/components/document/BrandedA4Template";

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
}

function formatAddress(address?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  if (!address) return [];

  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(" - "),
  ].filter(Boolean) as string[];
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, delivery, lineItems = [], totals, commercialTerms } = po;

  const itemRows = lineItems.map((item, index) => ({
    id: item.id,
    index: index + 1,
    description: item.description,
    details: [
      item.hsnSac ? `HSN/SAC: ${item.hsnSac}` : "",
      `Qty ${formatNumber(item.quantity, 2)} ${item.unit}`,
      `Rate ${formatCurrencyINR(item.rate)}`,
      item.gstRate ? `GST ${formatNumber(item.gstRate, 0)}%` : "",
    ].filter(Boolean).join(" • "),
    amount: formatCurrencyINR(item.lineTotal),
  }));

  return (
    <BrandedA4Template
      documentTitle="P.O."
      documentNumber={po.poNumber ? `No - ${po.poNumber}` : "No - 0000"}
      dateLabel={formatDate(po.poDate)}
      leftBlock={{
        label: "To:",
        title: vendor?.name || "Vendor Name",
        lines: [
          ...formatAddress(vendor?.address),
          vendor?.gstin ? `GSTIN: ${vendor.gstin}` : "",
          vendor?.contactPerson ? `Contact: ${vendor.contactPerson}` : "",
          vendor?.contact?.email || "",
          vendor?.contact?.phone || "",
        ],
      }}
      middleBlock={{
        label: "From:",
        title: buyer?.name || "Design Innsait",
        lines: [
          po.department || "Graphic Design Services",
          buyer?.contact?.email || "",
          buyer?.contact?.phone || "",
          "",
          ...formatAddress(buyer?.address),
          buyer?.gstin ? `GSTIN: ${buyer.gstin}` : "",
          vendor?.vendorCode ? `Vendor Code: ${vendor.vendorCode}` : "",
        ],
      }}
      rightMeta={[
        po.expectedDeliveryDate ? { label: "Delivery", value: formatDate(po.expectedDeliveryDate) } : undefined,
        po.quotationReference ? { label: "Quote Ref", value: po.quotationReference } : undefined,
      ].filter(Boolean) as { label: string; value: string }[]}
      items={itemRows}
      totalLabel="Total PO Value"
      totalValue={formatCurrencyINR(totals?.grandTotal || 0)}
      amountInWords={totals?.amountInWords || "Rupees Zero Only"}
      sections={[
        {
          title: "Delivery details:",
          content: (
            <div className="whitespace-pre-line">
              {[
                ...formatAddress(delivery?.address),
                delivery?.contactPerson ? `Contact Person: ${delivery.contactPerson}` : "",
                delivery?.contactPhone ? `Contact Number: ${delivery.contactPhone}` : "",
                delivery?.instructions ? `Instructions: ${delivery.instructions}` : "",
              ].filter(Boolean).join("\n") || "Add delivery address and logistics details to complete the PO."}
            </div>
          ),
        },
        {
          title: "Commercial terms:",
          content: (
            <div>
              {[
                po.paymentTerms ? `Payment Terms: ${po.paymentTerms}` : "",
                po.deliveryTerms ? `Delivery Terms: ${po.deliveryTerms}` : "",
                commercialTerms?.warrantyTerms ? `Warranty: ${commercialTerms.warrantyTerms}` : "",
                commercialTerms?.termsAndConditions ? `Terms: ${commercialTerms.termsAndConditions}` : "",
                commercialTerms?.notes ? `Notes: ${commercialTerms.notes}` : "",
              ].filter(Boolean).join("\n") || "Add commercial and contractual terms to complete the PO."}
            </div>
          ),
        },
      ]}
      closingNote="We appreciate your prompt fulfilment."
      footerText={buyer?.contact?.email || "Design Innsait"}
    />
  );
}
