import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
}

function Line({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-1 text-[10px]">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, delivery, lineItems = [], totals, commercialTerms } = po;

  return (
    <div className="text-[11px] leading-relaxed text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-gray-800">
        <div className="flex items-start gap-3">
          {buyer?.logoImageBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={buyer.logoImageBase64} alt="Logo" className="h-14 w-auto object-contain" />
          )}
          <div>
            <div className="text-base font-bold text-gray-900">{buyer?.name || "Buyer Company"}</div>
            {buyer?.address && (
              <div className="text-gray-600 text-[10px]">
                <div>{buyer.address.line1}{buyer.address.line2 ? `, ${buyer.address.line2}` : ""}</div>
                <div>{buyer.address.city}, {buyer.address.state} - {buyer.address.pincode}</div>
              </div>
            )}
            <div className="mt-0.5 text-[10px] text-gray-600 space-y-0.5">
              {buyer?.gstin && <div><span className="font-semibold">GSTIN:</span> {buyer.gstin}</div>}
              {buyer?.contact?.email && <div>{buyer.contact.email}</div>}
              {buyer?.contact?.phone && <div>{buyer.contact.phone}</div>}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-gray-900 tracking-wide">PURCHASE ORDER</div>
          <div className="mt-1.5 space-y-0.5 text-[10px]">
            <Line label="PO No." value={po.poNumber} />
            <Line label="PO Date" value={formatDate(po.poDate)} />
            <Line label="Delivery Date" value={formatDate(po.expectedDeliveryDate)} />
            <Line label="Payment Terms" value={po.paymentTerms} />
            <Line label="Vendor Code" value={vendor?.vendorCode} />
            <Line label="Quotation Ref." value={po.quotationReference} />
          </div>
        </div>
      </div>

      {/* ── Vendor + Delivery ── */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
        <div className="bg-gray-50 rounded p-2">
          <div className="font-semibold text-gray-700 mb-1 uppercase text-[9px] tracking-wider">Vendor / Supplier</div>
          <div className="font-bold text-gray-900">{vendor?.name}</div>
          {vendor?.address && (
            <div className="text-gray-600">
              <div>{vendor.address.line1}{vendor.address.line2 ? `, ${vendor.address.line2}` : ""}</div>
              <div>{vendor.address.city}, {vendor.address.state} - {vendor.address.pincode}</div>
            </div>
          )}
          {vendor?.gstin && <div><span className="font-semibold">GSTIN:</span> {vendor.gstin}</div>}
          {vendor?.contactPerson && <div><span className="font-semibold">Contact:</span> {vendor.contactPerson}</div>}
          {vendor?.contact?.email && <div>{vendor.contact.email}</div>}
          {vendor?.contact?.phone && <div>{vendor.contact.phone}</div>}
        </div>

        <div className="bg-gray-50 rounded p-2">
          <div className="font-semibold text-gray-700 mb-1 uppercase text-[9px] tracking-wider">Deliver To</div>
          {delivery?.address && (
            <div className="text-gray-600">
              <div>{delivery.address.line1}{delivery.address.line2 ? `, ${delivery.address.line2}` : ""}</div>
              <div>{delivery.address.city}, {delivery.address.state} - {delivery.address.pincode}</div>
            </div>
          )}
          {delivery?.contactPerson && <div><span className="font-semibold">Contact:</span> {delivery.contactPerson}</div>}
          {delivery?.contactPhone && <div>{delivery.contactPhone}</div>}
          {delivery?.instructions && <div className="text-gray-500 mt-0.5 italic">{delivery.instructions}</div>}
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
              <th className="px-1.5 py-1.5 text-right w-16">Tax Amt</th>
              <th className="px-1.5 py-1.5 text-right w-18">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-gray-400 italic">No line items yet.</td>
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
                  <td className="px-1.5 py-1 text-right">{formatNumber(item.taxAmount, 2)}</td>
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
            <div className="w-56 border border-gray-200 rounded overflow-hidden">
              {(
                [
                  ["Subtotal", totals.subtotal],
                  ...(totals.totalDiscount > 0 ? [["(-) Discount", totals.totalDiscount]] : []),
                  ["Taxable Value", totals.totalTaxableValue],
                  ...(totals.totalTax > 0 ? [["GST / Tax", totals.totalTax]] : []),
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

      {/* ── Commercial Terms + Signature ── */}
      <div className="print-keep-together text-[10px] space-y-2">
        {commercialTerms?.notes && <div><span className="font-semibold">Notes: </span>{commercialTerms.notes}</div>}
        {po.paymentTerms && <div><span className="font-semibold">Payment Terms: </span>{po.paymentTerms}</div>}
        {po.deliveryTerms && <div><span className="font-semibold">Delivery Terms: </span>{po.deliveryTerms}</div>}
        {commercialTerms?.warrantyTerms && <div><span className="font-semibold">Warranty: </span>{commercialTerms.warrantyTerms}</div>}
        {commercialTerms?.termsAndConditions && <div><span className="font-semibold">T&C: </span>{commercialTerms.termsAndConditions}</div>}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          {po.preparedBy && (
            <div className="text-center">
              {po.preparedBySignature?.signatureImageBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={po.preparedBySignature.signatureImageBase64} alt="Sig" className="h-8 w-auto mx-auto mb-1" />
              )}
              <div className="border-t border-gray-300 pt-1 text-[10px]">
                <div className="font-semibold">{po.preparedBy}</div>
                <div className="text-gray-500">Prepared By</div>
              </div>
            </div>
          )}
          <div className="text-center">
            {po.approvedBySignature?.signatureImageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={po.approvedBySignature.signatureImageBase64} alt="Sig" className="h-8 w-auto mx-auto mb-1" />
            )}
            <div className="border-t border-gray-300 pt-1 text-[10px]">
              <div className="font-semibold">{po.approvedBy || "Authorized Signatory"}</div>
              <div className="text-gray-500">{buyer?.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
