import type { PurchaseOrder, PODeliveryInfo } from "@/lib/types/purchase-order";
import { DesignInnsaeitDocumentShell } from "@/components/document/DesignInnsaeitDocumentShell";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

const BRAND_PURPLE = "#2828b0";
const BRAND_TEAL = "#00e5cc";
const TEAL_DARK = "#0e9b8a";

const PO_SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: 600,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  color: TEAL_DARK,
  borderBottom: `1.5px solid ${BRAND_TEAL}`,
  paddingBottom: "3px",
  marginBottom: "6px",
};

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
}

function DocLine({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", gap: "4px", fontSize: "9.5px", marginBottom: "2px" }}>
      <span style={{ color: "#6b7280", flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 500, color: "#111827" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: "#fef3c7", color: "#92400e", label: "Draft" },
    FINAL: { bg: "#d1fae5", color: "#065f46", label: "Final" },
    PAID: { bg: "#dbeafe", color: "#1e40af", label: "Paid" },
    CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  };
  const s = map[status] ?? { bg: "#f0fdfa", color: TEAL_DARK, label: status };
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: s.bg,
        color: s.color,
        fontSize: "8px",
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: "10px",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {s.label}
    </span>
  );
}

function addrLine(addr?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string }) {
  if (!addr) return null;
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.pincode,
  ].filter(Boolean);
  return parts;
}

function hasDeliveryData(
  delivery: Partial<PODeliveryInfo> | undefined,
  projectName?: string,
  department?: string
): boolean {
  if (!delivery && !projectName && !department) return false;
  const addr = delivery?.address;
  const hasAddr = !!(addr?.line1 || addr?.city);
  return (
    hasAddr ||
    !!(delivery?.instructions) ||
    !!(delivery?.contactPerson) ||
    !!(projectName) ||
    !!(department)
  );
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, delivery, lineItems = [], totals, commercialTerms } = po;

  const showDelivery = hasDeliveryData(delivery, po.projectName, po.department);
  const statusBadge = po.status ? <StatusBadge status={po.status} /> : undefined;

  return (
    <DesignInnsaeitDocumentShell
      title="Purchase Order"
      subtitle="Procurement / Vendor Confirmation"
      statusBadge={statusBadge}
    >
      {/* ── Section 2: PO Details + Buyer + Vendor ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* PO Details */}
        <div>
          <div style={PO_SECTION_LABEL_STYLE}>PO Details</div>
          <DocLine label="PO No." value={po.poNumber} />
          <DocLine label="PO Date" value={formatDate(po.poDate)} />
          <DocLine label="Expected Delivery" value={formatDate(po.expectedDeliveryDate)} />
          <DocLine label="Quotation Ref." value={po.quotationReference} />
          {po.quotationDate && (
            <DocLine label="Quotation Date" value={formatDate(po.quotationDate)} />
          )}
          {/* TODO: add dedicated serviceReference field to PurchaseOrder type for future use */}
          <DocLine label="Project" value={po.projectName} />
          <DocLine label="Department" value={po.department} />
          <DocLine label="Internal Req. No." value={po.internalRequisitionNumber} />
        </div>

        {/* Buyer */}
        <div>
          <div style={PO_SECTION_LABEL_STYLE}>Buyer</div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#111827", marginBottom: "3px" }}>
            {buyer?.name || "Design Innsaeit"}
          </div>
          {buyer?.address && (
            <div style={{ fontSize: "9.5px", color: "#374151", lineHeight: 1.5 }}>
              {addrLine(buyer.address)?.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: "4px" }}>
            {buyer?.gstin && <DocLine label="GSTIN" value={buyer.gstin} />}
            <DocLine label="State Code" value={buyer?.stateCode} />
            <DocLine label="Email" value={buyer?.contact?.email} />
            <DocLine label="Phone" value={buyer?.contact?.phone} />
          </div>
        </div>

        {/* Vendor */}
        <div>
          <div style={PO_SECTION_LABEL_STYLE}>Vendor / Supplier</div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#111827", marginBottom: "3px" }}>
            {vendor?.name || "—"}
          </div>
          {vendor?.address && (
            <div style={{ fontSize: "9.5px", color: "#374151", lineHeight: 1.5 }}>
              {addrLine(vendor.address)?.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: "4px" }}>
            {vendor?.gstin && <DocLine label="GSTIN" value={vendor.gstin} />}
            <DocLine label="State" value={vendor?.address?.state} />
            <DocLine label="State Code" value={vendor?.address?.stateCode} />
            {vendor?.vendorCode && <DocLine label="Vendor Code" value={vendor.vendorCode} />}
            {vendor?.contactPerson && <DocLine label="Contact" value={vendor.contactPerson} />}
            <DocLine label="Email" value={vendor?.contact?.email} />
            <DocLine label="Phone" value={vendor?.contact?.phone} />
          </div>
        </div>
      </div>

      {/* ── Section 3: Delivery / Service Details (conditional) ── */}
      {showDelivery && (
        <div
          style={{
            backgroundColor: "#f0fdfa",
            border: `1px solid ${BRAND_TEAL}55`,
            borderRadius: "4px",
            padding: "8px 12px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 600,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: TEAL_DARK,
              marginBottom: "6px",
            }}
          >
            Delivery / Service Details
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              fontSize: "9.5px",
            }}
          >
            <div>
              {(po.projectName || po.department) && (
                <div style={{ marginBottom: "4px" }}>
                  {po.projectName && (
                    <DocLine label="Project / Service" value={po.projectName} />
                  )}
                  {po.department && (
                    <DocLine label="Department" value={po.department} />
                  )}
                </div>
              )}
              {delivery?.address?.line1 && (
                <>
                  <div style={{ fontWeight: 600, color: "#374151", marginBottom: "2px" }}>Delivery / Service Location</div>
                  <div style={{ color: "#374151", lineHeight: 1.5 }}>
                    {addrLine(delivery.address)?.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              {delivery?.contactPerson && (
                <DocLine label="Contact" value={delivery.contactPerson} />
              )}
              {delivery?.contactPhone && (
                <DocLine label="Phone" value={delivery.contactPhone} />
              )}
              {po.expectedDeliveryDate && (
                <DocLine label="Expected By" value={formatDate(po.expectedDeliveryDate)} />
              )}
              {delivery?.modeOfDispatch && (
                <DocLine label="Mode" value={delivery.modeOfDispatch} />
              )}
              {delivery?.freightTerms && (
                <DocLine label="Freight Terms" value={delivery.freightTerms} />
              )}
              {delivery?.instructions && (
                <div style={{ marginTop: "4px", color: "#6b7280", fontStyle: "italic", fontSize: "9px" }}>
                  {delivery.instructions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: PO Item Table ── */}
      <div style={{ marginBottom: "14px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "9px",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "22px" }} />
            <col />
            <col style={{ width: "38px" }} />
            <col style={{ width: "34px" }} />
            <col style={{ width: "46px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "30px" }} />
            <col style={{ width: "46px" }} />
            <col style={{ width: "52px" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: BRAND_TEAL, color: "#0a2e2a" }}>
              <th style={{ padding: "5px 4px", textAlign: "center" }}>#</th>
              <th style={{ padding: "5px 4px", textAlign: "left" }}>Item / Service Description</th>
              <th style={{ padding: "5px 4px", textAlign: "center" }}>HSN / SAC</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Taxable Value</th>
              <th style={{ padding: "5px 4px", textAlign: "center" }}>GST%</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Tax Amount</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontStyle: "italic", fontSize: "9px" }}
                >
                  No line items yet.
                </td>
              </tr>
            ) : (
              lineItems.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f0fdfa" }}
                >
                  <td style={{ padding: "4px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "4px", borderBottom: "1px solid #e5e7eb", wordBreak: "break-word" }}>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{item.description}</div>
                  </td>
                  <td style={{ padding: "4px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                    {item.hsnSac || "—"}
                  </td>
                  <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                    {formatNumber(item.quantity, 2)}
                  </td>
                  <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                    {formatNumber(item.rate, 2)}
                  </td>
                  <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                    {formatNumber(item.taxableValue, 2)}
                  </td>
                  <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>
                    {item.gstRate}%
                  </td>
                  <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                    {formatNumber(item.taxAmount, 2)}
                  </td>
                  <td style={{ padding: "4px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
                    {formatNumber(item.lineTotal, 2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Section 5: Totals ── */}
      {totals && (
        <div className="print-keep-together" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "220px", border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
              {(
                [
                  ["Taxable Value (Subtotal)", totals.totalTaxableValue],
                  ...(totals.totalTax > 0 ? [["GST / Tax", totals.totalTax]] : []),
                  ...(totals.otherCharges > 0 ? [["Other Charges", totals.otherCharges]] : []),
                  ...(totals.roundOff !== 0 ? [["Round Off", totals.roundOff]] : []),
                ] as [string, number][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 10px",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: "9.5px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>{label}</span>
                  <span style={{ color: "#111827" }}>{formatNumber(value, 2)}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  backgroundColor: BRAND_PURPLE,
                  color: "#ffffff",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "10.5px" }}>Grand Total</span>
                <span style={{ fontWeight: 700, fontSize: "10.5px" }}>
                  {formatCurrencyINR(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {totals.amountInWords && (
            <div
              style={{
                backgroundColor: "#f0fdfa",
                border: `1px solid ${BRAND_TEAL}55`,
                borderRadius: "4px",
                padding: "6px 10px",
                marginTop: "8px",
                fontSize: "9.5px",
              }}
            >
              <span style={{ fontWeight: 600, color: TEAL_DARK }}>Amount in Words: </span>
              <span style={{ color: "#374151", fontStyle: "italic" }}>{totals.amountInWords}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Section 6: Terms / Notes ── */}
      {(po.paymentTerms || po.deliveryTerms || commercialTerms?.notes || commercialTerms?.termsAndConditions || commercialTerms?.warrantyTerms) && (
        <div className="print-keep-together" style={{ marginBottom: "14px" }}>
          <div style={PO_SECTION_LABEL_STYLE}>Terms &amp; Notes</div>
          <div style={{ fontSize: "9px", color: "#374151", lineHeight: 1.6 }}>
            {po.paymentTerms && (
              <div><span style={{ fontWeight: 600 }}>Payment Terms: </span>{po.paymentTerms}</div>
            )}
            {po.deliveryTerms && (
              <div><span style={{ fontWeight: 600 }}>Delivery Terms: </span>{po.deliveryTerms}</div>
            )}
            {commercialTerms?.notes && (
              <div><span style={{ fontWeight: 600 }}>Notes: </span>{commercialTerms.notes}</div>
            )}
            {commercialTerms?.warrantyTerms && (
              <div><span style={{ fontWeight: 600 }}>Warranty: </span>{commercialTerms.warrantyTerms}</div>
            )}
            {commercialTerms?.inspectionTerms && (
              <div><span style={{ fontWeight: 600 }}>Inspection: </span>{commercialTerms.inspectionTerms}</div>
            )}
            {commercialTerms?.returnPolicy && (
              <div><span style={{ fontWeight: 600 }}>Return Policy: </span>{commercialTerms.returnPolicy}</div>
            )}
            {commercialTerms?.cancellationPolicy && (
              <div><span style={{ fontWeight: 600 }}>Cancellation: </span>{commercialTerms.cancellationPolicy}</div>
            )}
            {commercialTerms?.termsAndConditions && (
              <div><span style={{ fontWeight: 600 }}>T&amp;C: </span>{commercialTerms.termsAndConditions}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 7: Signature Blocks ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: `1px solid ${BRAND_TEAL}55`,
        }}
      >
        {po.preparedBy && (
          <div style={{ textAlign: "center", fontSize: "9.5px", minWidth: "130px" }}>
            {po.preparedBySignature?.signatureImageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={po.preparedBySignature.signatureImageBase64}
                alt="Signature"
                crossOrigin="anonymous"
                style={{ height: "32px", width: "auto", objectFit: "contain", marginBottom: "4px" }}
              />
            )}
            <div
              style={{
                borderTop: `1px solid ${BRAND_TEAL}`,
                paddingTop: "4px",
              }}
            >
              <div style={{ fontWeight: 600, color: "#111827" }}>{po.preparedBy}</div>
              <div style={{ color: "#6b7280", fontSize: "9px" }}>Prepared By</div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "9.5px", minWidth: "130px" }}>
          {po.approvedBySignature?.signatureImageBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={po.approvedBySignature.signatureImageBase64}
              alt="Signature"
              crossOrigin="anonymous"
              style={{ height: "32px", width: "auto", objectFit: "contain", marginBottom: "4px" }}
            />
          )}
          <div
            style={{
              borderTop: `1px solid ${BRAND_TEAL}`,
              paddingTop: "4px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {po.approvedBy || "Authorized Signatory"}
            </div>
            <div style={{ color: "#6b7280", fontSize: "9px" }}>{buyer?.name}</div>
          </div>
        </div>
      </div>
    </DesignInnsaeitDocumentShell>
  );
}
