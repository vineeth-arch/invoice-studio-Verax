import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { DesignInnsaeitDocumentShell } from "@/components/document/DesignInnsaeitDocumentShell";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

const BRAND_PURPLE = "#2828b0";
const HEADER_LABEL_STYLE: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6b7280",
  marginBottom: "10px",
};

const DETAIL_TEXT_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "#374151",
  lineHeight: 1.55,
};

const DOC_VALUE_STYLE: React.CSSProperties = {
  fontSize: "11px",
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
  const s = map[status] ?? { bg: "#f3f4f6", color: "#374151", label: status };
  return (
    <span
      className={status === "DRAFT" ? "draft-badge" : undefined}
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
  email,
  logo,
  showUnregistered,
}: {
  label: string;
  name?: string;
  lines: string[];
  gstin?: string;
  phone?: string;
  email?: string;
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
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
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
          <div style={{ fontSize: "10px", color: "#6b7280" }}>Unregistered</div>
        ) : null}
        {phone && (
          <div>
            <span style={{ fontWeight: 600 }}>Phone:</span> {phone}
          </div>
        )}
        {email && (
          <div>
            <span style={{ fontWeight: 600 }}>Email:</span> {email}
          </div>
        )}
      </div>
    </div>
  );
}

export function POPreview({ po }: POPreviewProps) {
  const { buyer, vendor, lineItems = [], totals, commercialTerms } = po;
  const statusBadge = po.status ? <StatusBadge status={po.status} /> : undefined;
  const placeOfSupply = po.delivery?.address?.state || vendor?.address?.state || buyer?.address?.state;
  const validUntil = (po as Partial<PurchaseOrder> & { validUntil?: string }).validUntil;

  return (
    <DesignInnsaeitDocumentShell
      title="Purchase Order"
      subtitle="Procurement / Vendor Confirmation"
      statusBadge={statusBadge}
      footerEmail={buyer?.contact?.email ?? ""}
      footerPhone={buyer?.contact?.phone ?? ""}
      footerTagline={buyer?.name ?? ""}
      documentClassName="po-template"
    >
      <div
        style={{
          minHeight: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px 24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: "1px solid #d1d5db",
              marginBottom: "16px",
              paddingBottom: "14px",
            }}
          >
            <div style={{ borderRight: "1px solid #e5e7eb" }}>
              <PartyColumn
                label="From"
                name={buyer?.name}
                lines={buildAddressLines(buyer?.address)}
                gstin={buyer?.gstin}
                phone={buyer?.contact?.phone}
                email={buyer?.contact?.email}
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
              <DocMetaRow label="Valid Until" value={formatDate(validUntil)} />
              <DocMetaRow label="Delivery Date" value={formatDate(po.expectedDeliveryDate)} />

              {(po.projectDescription || placeOfSupply) && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                  {po.projectDescription && (
                    <div style={{ marginBottom: placeOfSupply ? "10px" : 0 }}>
                      <div style={HEADER_LABEL_STYLE}>Project / Service For</div>
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

          <div style={{ marginBottom: "16px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9px",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "34px" }} />
                <col />
                <col style={{ width: "72px" }} />
                <col style={{ width: "52px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "56px" }} />
                <col style={{ width: "84px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Item / Service Description</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>HSN/SAC</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Taxable</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>GST%</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontStyle: "italic", fontSize: "9px" }}
                    >
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => (
                    <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f3f4f6" }}>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", wordBreak: "break-word" }}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>{item.description}</div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                        {item.hsnSac || "—"}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                        {formatNumber(item.quantity, 2)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                        {formatNumber(item.rate, 2)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                        {formatNumber(item.taxableValue, 2)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                        {formatNumber(item.gstRate, 2)}%
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
                        {formatNumber(item.lineTotal, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totals && (
            <div className="print-keep-together" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "240px", border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                  {(
                    [
                      ["Subtotal", totals.subtotal],
                      ["Discount", totals.totalDiscount],
                      ["Taxable Value", totals.totalTaxableValue],
                      ["GST / Tax", totals.totalTax],
                      ...(totals.otherCharges > 0 ? [["Other Charges", totals.otherCharges]] : []),
                      ...(totals.roundOff !== 0 ? [["Round Off", totals.roundOff]] : []),
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 12px",
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
                      padding: "8px 12px",
                      backgroundColor: BRAND_PURPLE,
                      color: "#ffffff",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "10.5px" }}>Grand Total</span>
                    <span style={{ fontWeight: 700, fontSize: "10.5px" }}>{formatCurrencyINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {totals.amountInWords && (
                <div
                  style={{
                    marginTop: "8px",
                    textAlign: "right",
                    fontSize: "9.5px",
                    color: "#374151",
                    fontStyle: "italic",
                  }}
                >
                  Amount in Words: {totals.amountInWords}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "14px", marginTop: "16px" }}>
          {(po.paymentTerms || po.deliveryTerms || commercialTerms?.notes || commercialTerms?.termsAndConditions || commercialTerms?.warrantyTerms) && (
            <div className="print-keep-together" style={{ marginBottom: "14px" }}>
              <div style={HEADER_LABEL_STYLE}>Terms &amp; Conditions</div>
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

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <div style={{ textAlign: "center", minWidth: "170px", fontSize: "9.5px" }}>
              {po.approvedBySignature?.signatureImageBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={po.approvedBySignature.signatureImageBase64}
                  alt="Signature"
                  crossOrigin="anonymous"
                  style={{ height: "36px", width: "auto", objectFit: "contain", marginBottom: "4px" }}
                />
              )}
              <div
                style={{
                  borderTop: `1px solid ${BRAND_PURPLE}`,
                  paddingTop: "4px",
                  marginTop: "2px",
                }}
              >
                <div style={{ fontWeight: 600, color: "#111827" }}>{po.approvedBy || "Authorized Signatory"}</div>
                <div style={{ color: "#6b7280", fontSize: "9px" }}>{buyer?.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesignInnsaeitDocumentShell>
  );
}
