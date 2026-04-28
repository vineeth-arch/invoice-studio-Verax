import type { Invoice } from "@/lib/types/invoice";
import { INVOICE_TYPE_LABELS } from "@/lib/types/invoice";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
}

function Line({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-1">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { supplier, buyer, shipping, lineItems = [], totals, gstMode, signature, paymentDetails } = invoice;
  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const showTax = gstMode !== "NO_TAX";

  return (
    <div className="text-[11px] leading-relaxed text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-gray-800">
        <div className="flex items-start gap-3">
          {supplier?.logoImageBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={supplier.logoImageBase64} alt="Logo" className="h-14 w-auto object-contain" />
          )}
          <div>
            <div className="text-base font-bold text-gray-900">{supplier?.name || "Supplier Name"}</div>
            {supplier?.address && (
              <div className="text-gray-600 mt-0.5 text-[10px]">
                <div>{supplier.address.line1}{supplier.address.line2 ? `, ${supplier.address.line2}` : ""}</div>
                <div>{supplier.address.city}, {supplier.address.state} - {supplier.address.pincode}</div>
              </div>
            )}
            <div className="mt-0.5 space-y-0.5 text-[10px] text-gray-600">
              {supplier?.gstin && <div><span className="font-semibold">GSTIN:</span> {supplier.gstin}</div>}
              {supplier?.pan && <div><span className="font-semibold">PAN:</span> {supplier.pan}</div>}
              {supplier?.contact?.email && <div>{supplier.contact.email}</div>}
              {supplier?.contact?.phone && <div>{supplier.contact.phone}</div>}
              {supplier?.contact?.website && <div>{supplier.contact.website}</div>}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-gray-900 tracking-wide">
            {invoice.invoiceType ? INVOICE_TYPE_LABELS[invoice.invoiceType] : "TAX INVOICE"}
          </div>
          <div className="mt-1.5 space-y-0.5 text-[10px]">
            <Line label="Invoice No." value={invoice.invoiceNumber} />
            <Line label="Date" value={formatDate(invoice.invoiceDate)} />
            <Line label="Due Date" value={formatDate(invoice.dueDate)} />
            <Line label="PO Ref" value={invoice.poReference} />
            <Line label="E-Way Bill" value={invoice.ewayBillNumber} />
            <Line label="IRN" value={invoice.irnNumber} />
            <div className="text-[10px] mt-0.5">
              <span className="font-semibold">Reverse Charge:</span>{" "}
              {invoice.reverseCharge ? "Yes" : "No"}
            </div>
          </div>
          {invoice.irnQrImageBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invoice.irnQrImageBase64} alt="QR" className="h-14 w-14 mt-1 ml-auto" />
          )}
        </div>
      </div>

      {/* ── Bill To / Ship To ── */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
        <div className="bg-gray-50 rounded p-2">
          <div className="font-semibold text-gray-700 mb-1 uppercase text-[9px] tracking-wider">Bill To</div>
          <div className="font-bold text-gray-900">{buyer?.name}</div>
          {buyer?.billingAddress && (
            <div className="text-gray-600">
              <div>{buyer.billingAddress.line1}{buyer.billingAddress.line2 ? `, ${buyer.billingAddress.line2}` : ""}</div>
              <div>{buyer.billingAddress.city}, {buyer.billingAddress.state} - {buyer.billingAddress.pincode}</div>
            </div>
          )}
          {buyer?.gstin && <div><span className="font-semibold">GSTIN:</span> {buyer.gstin}</div>}
          {buyer?.placeOfSupply && <div><span className="font-semibold">Place of Supply:</span> {buyer.placeOfSupply}</div>}
          {buyer?.contact?.email && <div>{buyer.contact.email}</div>}
          {buyer?.contact?.phone && <div>{buyer.contact.phone}</div>}
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="font-semibold text-gray-700 mb-1 uppercase text-[9px] tracking-wider">Ship To</div>
          {shipping?.sameAsBilling ? (
            <div className="text-gray-500 italic text-[10px]">Same as billing address</div>
          ) : (
            <>
              <div className="font-bold text-gray-900">{shipping?.name}</div>
              {shipping?.address && (
                <div className="text-gray-600">
                  <div>{shipping.address.line1}{shipping.address.line2 ? `, ${shipping.address.line2}` : ""}</div>
                  <div>{shipping.address.city}, {shipping.address.state} - {shipping.address.pincode}</div>
                </div>
              )}
              {shipping?.contactPerson && <div><span className="font-semibold">Contact:</span> {shipping.contactPerson}</div>}
              {shipping?.contactPhone && <div>{shipping.contactPhone}</div>}
            </>
          )}
        </div>
      </div>

      {/* ── Line Items Table ── */}
      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-1.5 py-1.5 text-center w-6">#</th>
              <th className="px-1.5 py-1.5 text-left">Description / HSN</th>
              <th className="px-1.5 py-1.5 text-right w-12">Qty</th>
              <th className="px-1.5 py-1.5 text-center w-10">Unit</th>
              <th className="px-1.5 py-1.5 text-right w-16">Rate</th>
              <th className="px-1.5 py-1.5 text-right w-14">Disc%</th>
              <th className="px-1.5 py-1.5 text-right w-18">Taxable</th>
              <th className="px-1.5 py-1.5 text-right w-10">GST%</th>
              {isCGST && <th className="px-1.5 py-1.5 text-right w-14">CGST</th>}
              {isCGST && <th className="px-1.5 py-1.5 text-right w-14">SGST</th>}
              {isIGST && <th className="px-1.5 py-1.5 text-right w-14">IGST</th>}
              <th className="px-1.5 py-1.5 text-right w-18">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-6 text-gray-400 italic">No line items yet.</td>
              </tr>
            ) : (
              lineItems.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-1.5 py-1 text-center text-gray-500">{idx + 1}</td>
                  <td className="px-1.5 py-1">
                    <div className="font-medium">{item.description}</div>
                    {item.hsnSac && <div className="text-gray-400 text-[8.5px]">HSN/SAC: {item.hsnSac}</div>}
                  </td>
                  <td className="px-1.5 py-1 text-right">{formatNumber(item.quantity, 2)}</td>
                  <td className="px-1.5 py-1 text-center">{item.unit}</td>
                  <td className="px-1.5 py-1 text-right">{formatNumber(item.rate, 2)}</td>
                  <td className="px-1.5 py-1 text-right">{formatNumber(item.discountPercent, 1)}%</td>
                  <td className="px-1.5 py-1 text-right">{formatNumber(item.taxableValue, 2)}</td>
                  <td className="px-1.5 py-1 text-right">{item.gstRate}%</td>
                  {isCGST && <td className="px-1.5 py-1 text-right">{formatNumber(item.cgst, 2)}</td>}
                  {isCGST && <td className="px-1.5 py-1 text-right">{formatNumber(item.sgst, 2)}</td>}
                  {isIGST && <td className="px-1.5 py-1 text-right">{formatNumber(item.igst, 2)}</td>}
                  <td className="px-1.5 py-1 text-right font-medium">{formatNumber(item.lineTotal, 2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      {totals && (
        <div className="print-keep-together">
          <div className="flex justify-end mb-3">
            <div className="w-64 border border-gray-200 rounded overflow-hidden">
              {(
                [
                  ["Subtotal", totals.subtotal],
                  ...(totals.totalDiscount > 0 ? [["(-) Discount", totals.totalDiscount]] : []),
                  ["Taxable Value", totals.totalTaxableValue],
                  ...(showTax && isCGST && totals.totalCGST > 0 ? [["CGST", totals.totalCGST]] : []),
                  ...(showTax && isCGST && totals.totalSGST > 0 ? [["SGST/UTGST", totals.totalSGST]] : []),
                  ...(showTax && isIGST && totals.totalIGST > 0 ? [["IGST", totals.totalIGST]] : []),
                  ...(totals.cess > 0 ? [["Cess", totals.cess]] : []),
                  ...(totals.otherCharges > 0 ? [["Other Charges", totals.otherCharges]] : []),
                  ...(totals.roundOff !== 0 ? [["Round Off", totals.roundOff]] : []),
                ] as [string, number][]
              ).map(([label, value]) => (
                  <div key={label} className="flex justify-between px-3 py-1 border-b border-gray-100 text-[10px]">
                    <span className="text-gray-600">{label}</span>
                    <span>{formatNumber(value, 2)}</span>
                  </div>
                ))}
              <div className="flex justify-between px-3 py-2 bg-gray-800 text-white">
                <span className="font-bold text-[11px]">Grand Total</span>
                <span className="font-bold text-[11px]">{formatCurrencyINR(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 mb-3 text-[10px]">
            <span className="font-semibold text-gray-700">Amount in Words: </span>
            <span className="text-gray-900 italic">{totals.amountInWords}</span>
          </div>
        </div>
      )}

      {/* ── Payment + Terms ── */}
      <div className="print-keep-together">
        {paymentDetails && (paymentDetails.bankName || paymentDetails.upiId) && (
          <div className="grid grid-cols-2 gap-4 mb-3 text-[10px]">
            <div>
              <div className="font-semibold text-gray-700 mb-1">Payment Details</div>
              {paymentDetails.bankName && <div><span className="text-gray-500">Bank:</span> {paymentDetails.bankName}</div>}
              {paymentDetails.accountName && <div><span className="text-gray-500">Account Name:</span> {paymentDetails.accountName}</div>}
              {paymentDetails.accountNumber && <div><span className="text-gray-500">Account No.:</span> {paymentDetails.accountNumber}</div>}
              {paymentDetails.ifscCode && <div><span className="text-gray-500">IFSC:</span> {paymentDetails.ifscCode}</div>}
              {paymentDetails.upiId && <div><span className="text-gray-500">UPI:</span> {paymentDetails.upiId}</div>}
            </div>
            {paymentDetails.upiQrImageBase64 && (
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentDetails.upiQrImageBase64} alt="UPI QR" className="h-20 w-20 object-contain" />
                <span className="text-gray-400 text-[9px]">Scan to pay</span>
              </div>
            )}
          </div>
        )}

        {(invoice.notes || invoice.termsAndConditions || invoice.declaration) && (
          <div className="mb-3 text-[10px] space-y-1.5">
            {invoice.notes && <div><span className="font-semibold">Notes: </span>{invoice.notes}</div>}
            {invoice.termsAndConditions && <div><span className="font-semibold">Terms: </span>{invoice.termsAndConditions}</div>}
            {invoice.declaration && <div><span className="font-semibold">Declaration: </span>{invoice.declaration}</div>}
          </div>
        )}

        {/* ── Signature ── */}
        {signature && (
          <div className="flex justify-end mt-4">
            <div className="text-center text-[10px] min-w-[140px]">
              {signature.signatureImageBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signature.signatureImageBase64} alt="Signature" className="h-10 w-auto mx-auto mb-1 object-contain" />
              )}
              <div className="border-t border-gray-300 pt-1">
                <div className="font-semibold">{signature.signatoryName || "Authorized Signatory"}</div>
                {signature.designation && <div className="text-gray-500">{signature.designation}</div>}
                <div className="text-gray-500">{supplier?.name}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
