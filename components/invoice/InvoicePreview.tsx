import type { Invoice } from "@/lib/types/invoice";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";
import { BrandedA4Template } from "@/components/document/BrandedA4Template";

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
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

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { supplier, buyer, shipping, lineItems = [], totals, gstMode, signature, paymentDetails } = invoice;
  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const showTax = gstMode !== "NO_TAX";

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

  const termsContent = [
    invoice.termsAndConditions || "",
    invoice.dueDate ? `Due Date: ${formatDate(invoice.dueDate)}` : "",
    invoice.poReference ? `PO Reference: ${invoice.poReference}` : "",
    invoice.notes ? `Notes: ${invoice.notes}` : "",
  ].filter(Boolean).join(" ");

  const bankContent = [
    paymentDetails?.bankName ? `Bank: ${paymentDetails.bankName}` : "",
    paymentDetails?.accountName ? `Account Holder Name: ${paymentDetails.accountName}` : "",
    paymentDetails?.accountNumber ? `Account Number: ${paymentDetails.accountNumber}` : "",
    paymentDetails?.ifscCode ? `IFSC: ${paymentDetails.ifscCode}` : "",
    paymentDetails?.upiId ? `UPI ID: ${paymentDetails.upiId}` : "",
  ].filter(Boolean).join("\n");

  return (
    <BrandedA4Template
      documentTitle="Invoice."
      documentNumber={invoice.invoiceNumber ? `No - ${invoice.invoiceNumber}` : "No - 0000"}
      dateLabel={formatDate(invoice.invoiceDate)}
      leftBlock={{
        label: "To:",
        title: buyer?.name || "Client Name",
        lines: [
          ...formatAddress(buyer?.billingAddress),
          buyer?.gstin ? `GSTIN: ${buyer.gstin}` : "",
          buyer?.contact?.email || "",
          buyer?.contact?.phone || "",
        ],
      }}
      middleBlock={{
        label: "From:",
        title: supplier?.name || "Design Innsait",
        lines: [
          signature?.designation || "Graphic Design Services",
          supplier?.contact?.email || "",
          supplier?.contact?.phone || "",
          "",
          ...formatAddress(supplier?.address),
          supplier?.gstin ? `GSTIN: ${supplier.gstin}` : "",
          supplier?.pan ? `PAN: ${supplier.pan}` : "",
        ],
      }}
      rightMeta={[
        invoice.dueDate ? { label: "Due", value: formatDate(invoice.dueDate) } : undefined,
        invoice.poReference ? { label: "PO Ref", value: invoice.poReference } : undefined,
      ].filter(Boolean) as { label: string; value: string }[]}
      items={itemRows}
      totalLabel="Total Amount Due"
      totalValue={formatCurrencyINR(totals?.grandTotal || 0)}
      amountInWords={totals?.amountInWords || "Rupees Zero Only"}
      sections={[
        {
          title: "Bank Account details:",
          content: (
            <div className="whitespace-pre-line">
              {bankContent || "Add payment and banking details to show them here."}
            </div>
          ),
        },
        {
          title: "Payment terms:",
          content: (
            <div>
              {termsContent || "Add payment terms, notes, and delivery expectations to complete the invoice."}
              {shipping && !shipping.sameAsBilling && shipping.address ? (
                <div className="mt-2">
                  <span className="font-semibold">Ship To:</span>{" "}
                  {[shipping.name, ...formatAddress(shipping.address), shipping.contactPerson, shipping.contactPhone].filter(Boolean).join(", ")}
                </div>
              ) : null}
              {showTax ? (
                <div className="mt-2">
                  <span className="font-semibold">Tax Summary:</span>{" "}
                  {[
                    isCGST && totals?.totalCGST ? `CGST ${formatCurrencyINR(totals.totalCGST)}` : "",
                    isCGST && totals?.totalSGST ? `SGST ${formatCurrencyINR(totals.totalSGST)}` : "",
                    isIGST && totals?.totalIGST ? `IGST ${formatCurrencyINR(totals.totalIGST)}` : "",
                    totals?.cess ? `Cess ${formatCurrencyINR(totals.cess)}` : "",
                    totals?.otherCharges ? `Other Charges ${formatCurrencyINR(totals.otherCharges)}` : "",
                  ].filter(Boolean).join(" • ")}
                </div>
              ) : null}
            </div>
          ),
        },
      ]}
      closingNote="Thank you for your business!"
      footerText={supplier?.contact?.email || "Design Innsait"}
    />
  );
}
