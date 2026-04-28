import type { Invoice } from "@/lib/types/invoice";
import { INVOICE_TYPE_LABELS } from "@/lib/types/invoice";
import { BrandedDocumentTemplate } from "@/components/document/BrandedDocumentTemplate";
import { formatCurrencyINR, formatNumber } from "@/lib/utils/formatting";

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
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

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { supplier, buyer, shipping, lineItems = [], totals, gstMode, signature, paymentDetails } = invoice;
  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const invoiceLabel = invoice.invoiceType ? INVOICE_TYPE_LABELS[invoice.invoiceType] : "Invoice";
  const title = `${invoiceLabel.replace(/\bTax\s+/i, "").replace(/\s+/g, " ").trim() || "Invoice"}.`;

  const toLines = [
    ...formatAddress(buyer?.billingAddress),
    buyer?.gstin ? `GSTIN: ${buyer.gstin}` : "",
    buyer?.placeOfSupply ? `Place of Supply: ${buyer.placeOfSupply}` : "",
  ];

  const fromLines = [
    signature?.designation || "Design Consultant",
    supplier?.contact?.email || "",
    supplier?.contact?.phone || "",
    "",
    ...formatAddress(supplier?.address),
    supplier?.gstin ? `GSTIN: ${supplier.gstin}` : "",
    supplier?.pan ? `PAN: ${supplier.pan}` : "",
  ];

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

  const taxBreakdown = [
    isCGST && totals?.totalCGST ? `CGST: ${formatCurrencyINR(totals.totalCGST)}` : "",
    isCGST && totals?.totalSGST ? `SGST: ${formatCurrencyINR(totals.totalSGST)}` : "",
    isIGST && totals?.totalIGST ? `IGST: ${formatCurrencyINR(totals.totalIGST)}` : "",
    totals?.cess ? `Cess: ${formatCurrencyINR(totals.cess)}` : "",
    totals?.otherCharges ? `Other Charges: ${formatCurrencyINR(totals.otherCharges)}` : "",
    totals?.roundOff ? `Round Off: ${formatCurrencyINR(totals.roundOff)}` : "",
  ].filter(Boolean);

  return (
    <BrandedDocumentTemplate
      accent="#3210A7"
      accentAlt="#3311A8"
      title={title}
      subtitle="Graphic Design Services"
      companyName={supplier?.name || "Design Innsaeit"}
      logoImageBase64={supplier?.logoImageBase64}
      documentNumber={invoice.invoiceNumber ? `No. - ${invoice.invoiceNumber}` : "No. -"}
      date={formatDocumentDate(invoice.invoiceDate)}
      toBlock={{
        label: "To:",
        title: buyer?.name || "Client Name",
        lines: toLines,
      }}
      fromBlock={{
        label: "From:",
        title: supplier?.name || signature?.signatoryName || "Your Company",
        lines: fromLines,
      }}
      items={itemRows}
      summaryLabel="Total Amount Due"
      summaryAmount={formatCurrencyINR(totals?.grandTotal || 0)}
      amountInWords={totals?.amountInWords}
      sections={[
        {
          title: "Bank Account details:",
          lines: [
            paymentDetails?.accountName ? `Account Holder Name: ${paymentDetails.accountName}` : "",
            paymentDetails?.accountNumber ? `Account Number: ${paymentDetails.accountNumber}` : "",
            paymentDetails?.ifscCode ? `IFSC: ${paymentDetails.ifscCode}` : "",
            paymentDetails?.bankName ? `Bank: ${paymentDetails.bankName}` : "",
            paymentDetails?.branch ? `Branch: ${paymentDetails.branch}` : "",
            paymentDetails?.upiId ? `UPI ID: ${paymentDetails.upiId}` : "",
          ],
        },
        {
          title: "Payment terms:",
          lines: [
            invoice.termsAndConditions || "",
            invoice.dueDate ? `Due Date: ${formatDocumentDate(invoice.dueDate)}` : "",
            invoice.poReference ? `PO Reference: ${invoice.poReference}` : "",
          ],
        },
      ]}
      notes={
        <>
          {taxBreakdown.length > 0 ? <div><span className="font-semibold">Tax Summary:</span> {taxBreakdown.join("  |  ")}</div> : null}
          {invoice.notes ? <div className="mt-2"><span className="font-semibold">Notes:</span> {invoice.notes}</div> : null}
          {invoice.declaration ? <div className="mt-2"><span className="font-semibold">Declaration:</span> {invoice.declaration}</div> : null}
          {shipping && !shipping.sameAsBilling && shipping.address ? (
            <div className="mt-2">
              <span className="font-semibold">Ship To:</span> {[shipping.name, ...formatAddress(shipping.address), shipping.contactPerson, shipping.contactPhone].filter(Boolean).join(", ")}
            </div>
          ) : null}
        </>
      }
      footerContact={supplier?.contact?.email || supplier?.contact?.website || supplier?.name}
    />
  );
}
