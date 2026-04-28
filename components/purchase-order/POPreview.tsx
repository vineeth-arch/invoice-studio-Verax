import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { BrandedDocumentTemplate } from "@/components/document/BrandedDocumentTemplate";
import { formatCurrencyINR, formatNumber } from "@/lib/utils/formatting";

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
}

function formatDocumentDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = date.toLocaleString("en-IN", { month: "long" });
  const year = date.getFullYear();

  return `${String(day).padStart(2, "0")}${suffix} ${month} ${year}`;
}

function formatAddress(address?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  if (!address) return [];

  const cityLine = [address.city, address.state, address.pincode].filter(Boolean).join(", ");

  return [address.line1, address.line2, cityLine].filter(Boolean) as string[];
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, delivery, lineItems = [], totals, commercialTerms } = po;
  const itemRows = lineItems.map((item) => {
    const metaParts = [
      item.hsnSac ? `HSN/SAC ${item.hsnSac}` : "",
      `Qty ${formatNumber(item.quantity, 2)} ${item.unit}`,
      `Rate ${formatCurrencyINR(item.rate)}`,
      item.discountPercent > 0 ? `Discount ${formatNumber(item.discountPercent, 1)}%` : "",
      item.gstRate > 0 ? `GST ${formatNumber(item.gstRate, 0)}%` : "",
    ].filter(Boolean);

    return {
      id: item.id,
      description: item.description,
      meta: metaParts.join("  |  "),
      amount: formatCurrencyINR(item.lineTotal),
    };
  });

  return (
    <BrandedDocumentTemplate
      accent="#0F766E"
      accentAlt="#115E59"
      title="Purchase Order."
      subtitle="Graphic Design Services"
      companyName={buyer?.name || "Buyer Company"}
      logoImageBase64={buyer?.logoImageBase64}
      documentNumber={po.poNumber ? `PO. - ${po.poNumber}` : "PO. -"}
      date={formatDocumentDate(po.poDate)}
      toBlock={{
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
      fromBlock={{
        label: "From:",
        title: buyer?.name || po.approvedBy || "Buyer Company",
        lines: [
          po.department || "Procurement Team",
          buyer?.contact?.email || "",
          buyer?.contact?.phone || "",
          "",
          ...formatAddress(buyer?.address),
          buyer?.gstin ? `GSTIN: ${buyer.gstin}` : "",
          vendor?.vendorCode ? `Vendor Code: ${vendor.vendorCode}` : "",
        ],
      }}
      items={itemRows}
      summaryLabel="Total PO Value"
      summaryAmount={formatCurrencyINR(totals?.grandTotal || 0)}
      amountInWords={totals?.amountInWords}
      sections={[
        {
          title: "Delivery details:",
          lines: [
            ...formatAddress(delivery?.address),
            delivery?.contactPerson ? `Contact Person: ${delivery.contactPerson}` : "",
            delivery?.contactPhone ? `Contact Number: ${delivery.contactPhone}` : "",
            delivery?.modeOfDispatch ? `Dispatch Mode: ${delivery.modeOfDispatch}` : "",
            delivery?.freightTerms ? `Freight Terms: ${delivery.freightTerms}` : "",
          ],
        },
        {
          title: "Commercial terms:",
          lines: [
            po.paymentTerms ? `Payment Terms: ${po.paymentTerms}` : "",
            po.deliveryTerms ? `Delivery Terms: ${po.deliveryTerms}` : "",
            commercialTerms?.warrantyTerms ? `Warranty: ${commercialTerms.warrantyTerms}` : "",
            commercialTerms?.inspectionTerms ? `Inspection: ${commercialTerms.inspectionTerms}` : "",
            commercialTerms?.termsAndConditions ? commercialTerms.termsAndConditions : "",
          ],
        },
      ]}
      notes={
        <>
          {totals?.totalTax ? <div><span className="font-semibold">Tax Summary:</span> GST / Tax {formatCurrencyINR(totals.totalTax)}</div> : null}
          {commercialTerms?.notes ? <div className="mt-2"><span className="font-semibold">Notes:</span> {commercialTerms.notes}</div> : null}
          {po.quotationReference ? <div className="mt-2"><span className="font-semibold">Quotation Reference:</span> {po.quotationReference}</div> : null}
          {po.expectedDeliveryDate ? <div className="mt-2"><span className="font-semibold">Expected Delivery Date:</span> {formatDocumentDate(po.expectedDeliveryDate)}</div> : null}
        </>
      }
      footerContact={buyer?.contact?.email || buyer?.name}
      closingNote="We appreciate your prompt fulfilment."
    />
  );
}
