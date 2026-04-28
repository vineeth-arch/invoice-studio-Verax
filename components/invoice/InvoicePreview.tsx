import type { Invoice } from "@/lib/types/invoice";
import { DesignInnsaeitDocumentShell } from "@/components/document/DesignInnsaeitDocumentShell";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

const BRAND_PURPLE = "#2828b0";
const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: 600,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  color: BRAND_PURPLE,
  borderBottom: `1.5px solid ${BRAND_PURPLE}`,
  paddingBottom: "3px",
  marginBottom: "6px",
};

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
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
  const s = map[status] ?? { bg: "#f3f4f6", color: "#374151", label: status };
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
  return [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.pincode,
  ].filter(Boolean);
}

function hasShippingDiff(
  shipping: Invoice["shipping"] | undefined,
  buyer: Invoice["buyer"] | undefined
): boolean {
  if (!shipping || shipping.sameAsBilling) return false;
  if (!shipping.address) return false;
  const sa = shipping.address;
  const ba = buyer?.billingAddress;
  if (!ba) return true;
  return sa.line1 !== ba.line1 || sa.city !== ba.city || sa.pincode !== ba.pincode;
}

const DI_BANK = {
  accountName: "DESIGN INNSAEIT",
  bankName: "State Bank of India",
  accountNumber: "44882657226",
  branch: "GOREGAON (WEST) MUMBAI",
  ifscCode: "SBIN0001266",
  micr: "400002030",
};

const DEFAULT_TERMS = [
  "Payment due as per agreed terms.",
  "This is a computer-generated invoice.",
  "Services are delivered digitally unless otherwise specified.",
];

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const {
    supplier,
    buyer,
    shipping,
    lineItems = [],
    totals,
    gstMode,
    signature,
    paymentDetails,
  } = invoice;

  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const showTax = gstMode !== "NO_TAX";
  const showServiceLocation = hasShippingDiff(shipping, buyer);
  const serviceRef = invoice.poReference;
  const bank = paymentDetails?.bankName || paymentDetails?.accountNumber ? paymentDetails : null;
  const statusBadge = invoice.status ? <StatusBadge status={invoice.status} /> : undefined;

  const colCount = 6 + (isCGST ? 2 : 0) + (isIGST ? 1 : 0) + 1;

  return (
    <DesignInnsaeitDocumentShell
      title="Tax Invoice"
      subtitle="Design Consultancy / Creative Services"
      statusBadge={statusBadge}
    >
      <div style={{ display: "flex", minHeight: "100%", flexDirection: "column" }}>
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={SECTION_LABEL_STYLE}>Invoice Details</div>
              <DocLine label="Invoice No." value={invoice.invoiceNumber} />
              <DocLine label="Date" value={formatDate(invoice.invoiceDate)} />
              <DocLine label="Due Date" value={formatDate(invoice.dueDate)} />
              <DocLine label="Supplier GSTIN" value={supplier?.gstin} />
              <DocLine label="State Code" value={supplier?.stateCode} />
              <DocLine label="Place of Supply" value={buyer?.placeOfSupply} />
              <DocLine label="Reverse Charge" value={invoice.reverseCharge ? "Yes" : "No"} />
              {invoice.ewayBillNumber && <DocLine label="E-Way Bill" value={invoice.ewayBillNumber} />}
              {invoice.irnNumber && <DocLine label="IRN" value={invoice.irnNumber} />}
            </div>

            <div>
              <div style={SECTION_LABEL_STYLE}>From</div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#111827", marginBottom: "3px" }}>
                {supplier?.name || "Design Innsaeit"}
              </div>
              {supplier?.address && (
                <div style={{ fontSize: "9.5px", color: "#374151", lineHeight: 1.5 }}>
                  {addrLine(supplier.address)?.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "4px" }}>
                <DocLine label="GSTIN" value={supplier?.gstin} />
                {supplier?.pan && <DocLine label="PAN" value={supplier.pan} />}
                <DocLine label="State Code" value={supplier?.stateCode} />
                <DocLine label="Email" value={supplier?.contact?.email} />
                <DocLine label="Phone" value={supplier?.contact?.phone} />
              </div>
            </div>

            <div>
              <div style={SECTION_LABEL_STYLE}>Bill To / Recipient</div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#111827", marginBottom: "3px" }}>
                {buyer?.name || "—"}
              </div>
              {buyer?.billingAddress && (
                <div style={{ fontSize: "9.5px", color: "#374151", lineHeight: 1.5 }}>
                  {addrLine(buyer.billingAddress)?.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "4px" }}>
                {buyer?.gstin && <DocLine label="GSTIN" value={buyer.gstin} />}
                <DocLine label="State" value={buyer?.billingAddress?.state} />
                <DocLine label="State Code" value={buyer?.billingAddress?.stateCode} />
                <DocLine label="Place of Supply" value={buyer?.placeOfSupply} />
                {buyer?.contact?.email && <DocLine label="Email" value={buyer.contact.email} />}
                {buyer?.contact?.phone && <DocLine label="Phone" value={buyer.contact.phone} />}
              </div>
            </div>
          </div>

          {serviceRef && (
            <div
              style={{
                backgroundColor: "#f5f3ff",
                border: `1px solid ${BRAND_PURPLE}22`,
                borderRadius: "4px",
                padding: "7px 12px",
                marginBottom: "14px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontSize: "9.5px",
              }}
            >
              <span style={{ fontWeight: 600, color: BRAND_PURPLE }}>Service / Project Reference:</span>
              <span style={{ color: "#374151" }}>{serviceRef}</span>
            </div>
          )}

          {showServiceLocation && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "4px",
                padding: "7px 12px",
                marginBottom: "14px",
                fontSize: "9.5px",
              }}
            >
              <div style={{ fontWeight: 600, color: "#065f46", marginBottom: "3px" }}>Service Location / Delivered To</div>
              <div style={{ fontWeight: 600, color: "#111827" }}>{shipping?.name}</div>
              {shipping?.address && (
                <div style={{ color: "#374151", lineHeight: 1.5 }}>
                  {addrLine(shipping.address)?.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
              {shipping?.contactPerson && <div style={{ color: "#6b7280" }}>Contact: {shipping.contactPerson}</div>}
              {shipping?.contactPhone && <div style={{ color: "#6b7280" }}>{shipping.contactPhone}</div>}
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
                <col style={{ width: "34px" }} />
                <col style={{ width: "34px" }} />
                <col style={{ width: "46px" }} />
                <col style={{ width: "52px" }} />
                <col style={{ width: "30px" }} />
                {isCGST && <col style={{ width: "42px" }} />}
                {isCGST && <col style={{ width: "42px" }} />}
                {isIGST && <col style={{ width: "46px" }} />}
                <col style={{ width: "52px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "5px 4px", textAlign: "left" }}>Description of Service</th>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>SAC</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Taxable</th>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>GST%</th>
                  {isCGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>CGST</th>}
                  {isCGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>SGST</th>}
                  {isIGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>IGST</th>}
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colCount}
                      style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontStyle: "italic", fontSize: "9px" }}
                    >
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => (
                    <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f5f3ff" }}>
                      <td style={{ padding: "4px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{index + 1}</td>
                      <td style={{ padding: "4px", borderBottom: "1px solid #e5e7eb", wordBreak: "break-word" }}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>{item.description}</div>
                      </td>
                      <td style={{ padding: "4px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{item.hsnSac || "—"}</td>
                      <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.quantity, 2)}</td>
                      <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.rate, 2)}</td>
                      <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.taxableValue, 2)}</td>
                      <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>{item.gstRate}%</td>
                      {isCGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.cgst, 2)}</td>}
                      {isCGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.sgst, 2)}</td>}
                      {isIGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.igst, 2)}</td>}
                      <td style={{ padding: "4px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.lineTotal, 2)}</td>
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
                      ["Taxable Value", totals.totalTaxableValue],
                      ...(showTax && isCGST && totals.totalCGST > 0 ? [["CGST", totals.totalCGST]] : []),
                      ...(showTax && isCGST && totals.totalSGST > 0 ? [["SGST / UTGST", totals.totalSGST]] : []),
                      ...(showTax && isIGST && totals.totalIGST > 0 ? [["IGST", totals.totalIGST]] : []),
                      ...(totals.cess > 0 ? [["Cess", totals.cess]] : []),
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
                    <span style={{ fontWeight: 700, fontSize: "10.5px" }}>{formatCurrencyINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {totals.amountInWords && (
                <div
                  style={{
                    backgroundColor: "#f5f3ff",
                    border: `1px solid ${BRAND_PURPLE}33`,
                    borderRadius: "4px",
                    padding: "6px 10px",
                    marginTop: "8px",
                    fontSize: "9.5px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: BRAND_PURPLE }}>Amount in Words: </span>
                  <span style={{ color: "#374151", fontStyle: "italic" }}>{totals.amountInWords}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "14px" }}>
          <div className="print-keep-together" style={{ marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={SECTION_LABEL_STYLE}>Bank / Payment Details</div>
                {(bank ? (
                  <>
                    {bank.accountName && <DocLine label="Account Name" value={bank.accountName} />}
                    {bank.bankName && <DocLine label="Bank" value={bank.bankName} />}
                    {bank.accountNumber && <DocLine label="Account No." value={bank.accountNumber} />}
                    {bank.branch && <DocLine label="Branch" value={bank.branch} />}
                    {bank.ifscCode && <DocLine label="IFSC" value={bank.ifscCode} />}
                    {bank.upiId && <DocLine label="UPI" value={bank.upiId} />}
                  </>
                ) : (
                  <>
                    <DocLine label="Account Name" value={DI_BANK.accountName} />
                    <DocLine label="Bank" value={DI_BANK.bankName} />
                    <DocLine label="Account No." value={DI_BANK.accountNumber} />
                    <DocLine label="Branch" value={DI_BANK.branch} />
                    <DocLine label="IFSC" value={DI_BANK.ifscCode} />
                    <DocLine label="MICR" value={DI_BANK.micr} />
                  </>
                ))}
              </div>

              {bank?.upiQrImageBase64 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bank.upiQrImageBase64}
                    alt="UPI QR"
                    crossOrigin="anonymous"
                    style={{ height: "72px", width: "72px", objectFit: "contain" }}
                  />
                  <span style={{ fontSize: "8px", color: "#9ca3af", marginTop: "3px" }}>Scan to pay</span>
                </div>
              )}
            </div>
          </div>

          {(invoice.notes || invoice.termsAndConditions || invoice.declaration || !invoice.termsAndConditions) && (
            <div className="print-keep-together" style={{ marginBottom: "14px" }}>
              <div style={SECTION_LABEL_STYLE}>Notes &amp; Terms</div>
              {invoice.notes && (
                <div style={{ fontSize: "9px", color: "#374151", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600 }}>Notes: </span>{invoice.notes}
                </div>
              )}
              <div style={{ fontSize: "9px", color: "#374151" }}>
                {invoice.termsAndConditions ? (
                  <div>
                    <span style={{ fontWeight: 600 }}>Terms: </span>{invoice.termsAndConditions}
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "14px", lineHeight: 1.6 }}>
                    {DEFAULT_TERMS.map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ul>
                )}
              </div>
              {invoice.declaration && (
                <div style={{ fontSize: "9px", color: "#374151", marginTop: "4px" }}>
                  <span style={{ fontWeight: 600 }}>Declaration: </span>{invoice.declaration}
                </div>
              )}
            </div>
          )}

          {signature && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <div style={{ textAlign: "center", minWidth: "150px", fontSize: "9.5px" }}>
                {signature.signatureImageBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signature.signatureImageBase64}
                    alt="Signature"
                    crossOrigin="anonymous"
                    style={{ height: "36px", width: "auto", objectFit: "contain", marginBottom: "4px" }}
                  />
                )}
                {invoice.irnQrImageBase64 && !signature.signatureImageBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invoice.irnQrImageBase64}
                    alt="IRN QR"
                    crossOrigin="anonymous"
                    style={{ height: "52px", width: "52px", objectFit: "contain", marginBottom: "4px" }}
                  />
                )}
                <div
                  style={{
                    borderTop: `1px solid ${BRAND_PURPLE}`,
                    paddingTop: "4px",
                    marginTop: "2px",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#111827" }}>{signature.signatoryName || "Authorized Signatory"}</div>
                  {signature.designation && <div style={{ color: "#6b7280", fontSize: "9px" }}>{signature.designation}</div>}
                  <div style={{ color: "#6b7280", fontSize: "9px" }}>{supplier?.name}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DesignInnsaeitDocumentShell>
  );
}
