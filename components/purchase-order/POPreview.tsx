import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { DesignInnsaeitDocumentShell } from "@/components/document/DesignInnsaeitDocumentShell";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

const BRAND_PURPLE = "#2828b0";
const BRAND_TEAL = "#00e5cc";
const TEAL_DARK = "#0e9b8a";
const HEADER_LABEL_STYLE: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1.2px",
  textTransform: "uppercase",
  color: "#6b7280",
  marginBottom: "10px",
};

const DETAIL_TEXT_STYLE: React.CSSProperties = {
  fontSize: "11.5px",
  color: "#374151",
  lineHeight: 1.55,
};

const DOC_VALUE_STYLE: React.CSSProperties = {
  fontSize: "11.5px",
  fontWeight: 500,
  color: "#111827",
  textAlign: "right",
};

interface POPreviewProps {
  po: Partial<PurchaseOrder>;
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

function buildAddressLines(addr?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): string[] {
  if (!addr) return [];
  const cityStatePincode = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  return [addr.line1, addr.line2, cityStatePincode].filter((line): line is string => Boolean(line));
}

function hasDeliveryData(po: Partial<PurchaseOrder>): boolean {
  const delivery = po.delivery;
  const addr = delivery?.address;
  return Boolean(
    addr?.line1 ||
    addr?.city ||
    delivery?.instructions ||
    delivery?.contactPerson ||
    delivery?.contactPhone ||
    po.projectName ||
    po.department
  );
}

function DocMetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "5px",
      }}
    >
      <span style={{ ...DETAIL_TEXT_STYLE, color: "#6b7280" }}>{label}</span>
      <span style={DOC_VALUE_STYLE}>{value}</span>
    </div>
  );
}

function PartyColumn({
  label,
  name,
  lines,
  gstin,
  phone,
  logo,
  showUnregistered,
}: {
  label: string;
  name?: string;
  lines: string[];
  gstin?: string;
  phone?: string;
  logo?: string;
  showUnregistered?: boolean;
}) {
  return (
    <div style={{ padding: "0 14px" }}>
      <div style={HEADER_LABEL_STYLE}>{label}</div>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${name || label} logo`}
          crossOrigin="anonymous"
          style={{ maxHeight: "38px", width: "auto", objectFit: "contain", marginBottom: "8px" }}
        />
      )}
      <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
        {name || "—"}
      </div>
      <div style={DETAIL_TEXT_STYLE}>
        {lines.map((line, index) => (
          <div key={`${label}-${index}`}>{line}</div>
        ))}
      </div>
      <div style={{ marginTop: "6px", ...DETAIL_TEXT_STYLE }}>
        {gstin ? (
          <div>
            <span style={{ fontWeight: 600 }}>GSTIN:</span> {gstin}
          </div>
        ) : showUnregistered ? (
          <div style={{ fontSize: "10.5px", color: "#6b7280" }}>Unregistered</div>
        ) : null}
        {phone && (
          <div>
            <span style={{ fontWeight: 600 }}>Phone:</span> {phone}
          </div>
        )}
      </div>
    </div>
  );
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, delivery, lineItems = [], totals, commercialTerms } = po;
  const showDelivery = hasDeliveryData(po);
  const statusBadge = po.status ? <StatusBadge status={po.status} /> : undefined;
  const placeOfSupply = delivery?.address?.state || vendor?.address?.state || buyer?.address?.state;

  return (
    <DesignInnsaeitDocumentShell
      title="Purchase Order"
      subtitle="Procurement / Vendor Confirmation"
      statusBadge={statusBadge}
    >
      <div
        style={{
          minHeight: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: "1px solid #d1d5db",
              marginBottom: "14px",
              paddingBottom: "14px",
            }}
          >
            <div style={{ borderRight: "1px solid #e5e7eb" }}>
              <PartyColumn
                label="From"
                name={buyer?.name || "Design Innsaeit"}
                lines={buildAddressLines(buyer?.address)}
                gstin={buyer?.gstin}
                phone={buyer?.contact?.phone}
                logo={buyer?.logoImageBase64}
              />
            </div>

            <div style={{ borderRight: "1px solid #e5e7eb" }}>
              <PartyColumn
                label="Bill To"
                name={vendor?.name}
                lines={buildAddressLines(vendor?.address)}
                gstin={vendor?.gstin}
                showUnregistered
              />
            </div>

            <div style={{ padding: "0 14px" }}>
              <div style={HEADER_LABEL_STYLE}>Doc Details</div>
              <DocMetaRow label="PO No." value={po.poNumber} />
              <DocMetaRow label="PO Date" value={formatDate(po.poDate)} />
              <DocMetaRow label="Valid Until" value={formatDate(po.expectedDeliveryDate)} />

              {(po.projectDescription || placeOfSupply) && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                  {po.projectDescription && (
                    <div style={{ marginBottom: placeOfSupply ? "10px" : 0 }}>
                      <div style={HEADER_LABEL_STYLE}>Service For / Project</div>
                      <div style={DETAIL_TEXT_STYLE}>{po.projectDescription}</div>
                    </div>
                  )}
                  {placeOfSupply && (
                    <div>
                      <div style={HEADER_LABEL_STYLE}>Place of Supply</div>
                      <div style={DETAIL_TEXT_STYLE}>{placeOfSupply}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
                    <div style={{ marginBottom: "4px", color: "#374151" }}>
                      {po.projectName && <div><span style={{ fontWeight: 600 }}>Project / Service:</span> {po.projectName}</div>}
                      {po.department && <div><span style={{ fontWeight: 600 }}>Department:</span> {po.department}</div>}
                    </div>
                  )}
                  {delivery?.address?.line1 && (
                    <>
                      <div style={{ fontWeight: 600, color: "#374151", marginBottom: "2px" }}>Delivery / Service Location</div>
                      <div style={{ color: "#374151", lineHeight: 1.5 }}>
                        {buildAddressLines(delivery.address).map((line, index) => (
                          <div key={index}>{line}</div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  {delivery?.contactPerson && <div style={{ color: "#374151" }}><span style={{ fontWeight: 600 }}>Contact:</span> {delivery.contactPerson}</div>}
                  {delivery?.contactPhone && <div style={{ color: "#374151" }}><span style={{ fontWeight: 600 }}>Phone:</span> {delivery.contactPhone}</div>}
                  {po.expectedDeliveryDate && <div style={{ color: "#374151" }}><span style={{ fontWeight: 600 }}>Expected By:</span> {formatDate(po.expectedDeliveryDate)}</div>}
                  {delivery?.modeOfDispatch && <div style={{ color: "#374151" }}><span style={{ fontWeight: 600 }}>Mode:</span> {delivery.modeOfDispatch}</div>}
                  {delivery?.freightTerms && <div style={{ color: "#374151" }}><span style={{ fontWeight: 600 }}>Freight Terms:</span> {delivery.freightTerms}</div>}
                  {delivery?.instructions && (
                    <div style={{ marginTop: "4px", color: "#6b7280", fontStyle: "italic", fontSize: "9px" }}>
                      {delivery.instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
        </div>

        <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "14px", marginTop: "16px" }}>
          {(po.paymentTerms || po.deliveryTerms || commercialTerms?.notes || commercialTerms?.termsAndConditions || commercialTerms?.warrantyTerms) && (
            <div className="print-keep-together" style={{ marginBottom: "14px" }}>
              <div style={HEADER_LABEL_STYLE}>Terms &amp; Notes</div>
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
        </div>
      </div>
    </DesignInnsaeitDocumentShell>
  );
}
