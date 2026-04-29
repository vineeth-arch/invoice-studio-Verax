import type { Invoice } from "@/lib/types/invoice";
import { DesignInnsaeitDocumentShell } from "@/components/document/DesignInnsaeitDocumentShell";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";
import { getDisplayInvoiceNumber, isProformaInvoice, resolveInvoiceType } from "@/lib/utils/invoiceTypes";
import { getCreditNotesTotal, getEffectiveOutstanding } from "@/lib/utils/invoiceFinancials";

const BRAND_PURPLE = "#2828b0";
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

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
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
        {email && (
          <div>
            <span style={{ fontWeight: 600 }}>Email:</span> {email}
          </div>
        )}
      </div>
    </div>
  );
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

  const isProforma = isProformaInvoice(invoice);
  const isCreditNote = resolveInvoiceType(invoice) === "CREDIT_NOTE";
  const isCGST = gstMode === "CGST_SGST";
  const isIGST = gstMode === "IGST";
  const showTax = !isProforma && gstMode !== "NO_TAX";
  const showServiceLocation = hasShippingDiff(shipping, buyer);
  const bank = paymentDetails?.bankName || paymentDetails?.accountNumber ? paymentDetails : null;
  const statusBadge = invoice.status ? <StatusBadge status={invoice.status} /> : undefined;
  const colCount = isProforma ? 7 : 6 + (isCGST ? 2 : 0) + (isIGST ? 1 : 0) + 1;
  const showTdsSummary = invoice.tdsApplicable && (invoice.tdsAmount ?? 0) > 0;
  const netPayableAfterTds = (totals?.grandTotal ?? 0) - (invoice.tdsAmount ?? 0);

  return (
    <DesignInnsaeitDocumentShell
      title={isCreditNote ? "CREDIT NOTE" : isProforma ? "PROFORMA INVOICE" : "Tax Invoice"}
      subtitle="Design Consultancy / Creative Services"
      statusBadge={statusBadge}
      footerEmail={supplier?.contact?.email ?? ""}
      footerPhone={supplier?.contact?.phone ?? ""}
      footerTagline={supplier?.name ?? ""}
      documentClassName="invoice-template"
    >
      <div
        style={{
          position: "relative",
          minHeight: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {isProforma && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "42%",
              transform: "translate(-50%, -50%) rotate(-24deg)",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "rgba(148, 163, 184, 0.2)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            PROFORMA - NOT A TAX DOCUMENT
          </div>
        )}
        <div style={{ flex: 1, padding: "16px 24px" }}>
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
                name={supplier?.name || "Design Innsaeit"}
                lines={buildAddressLines(supplier?.address)}
                gstin={supplier?.gstin}
                phone={supplier?.contact?.phone}
                email={supplier?.contact?.email}
                logo={supplier?.logoImageBase64}
              />
            </div>

            <div style={{ borderRight: "1px solid #e5e7eb" }}>
              <PartyColumn
                label="Bill To"
                name={buyer?.name}
                lines={buildAddressLines(buyer?.billingAddress)}
                gstin={isProforma ? undefined : buyer?.gstin}
                showUnregistered
              />
            </div>

            <div style={{ padding: "0 14px" }}>
              <div style={HEADER_LABEL_STYLE}>Doc Details</div>
              <DocMetaRow label={isProforma ? "Proforma No." : isCreditNote ? "Credit Note No." : "Invoice No."} value={getDisplayInvoiceNumber(invoice)} />
              <DocMetaRow label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
              <DocMetaRow label={isProforma ? "Valid Until" : "Due Date"} value={formatDate(invoice.dueDate)} />
              <DocMetaRow label="PO Reference" value={invoice.poReference} />
              {!isProforma && <DocMetaRow label="E-Way Bill" value={invoice.ewayBillNumber} />}
              {isCreditNote && <DocMetaRow label="Against Invoice No." value={invoice.linkedInvoiceNumber} />}

              {(invoice.projectDescription || buyer?.placeOfSupply) && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                  {invoice.projectDescription && (
                    <div style={{ marginBottom: buyer?.placeOfSupply ? "10px" : 0 }}>
                      <div style={HEADER_LABEL_STYLE}>Service For / Project</div>
                      <div style={DETAIL_TEXT_STYLE}>{invoice.projectDescription}</div>
                    </div>
                  )}
                  {buyer?.placeOfSupply && (
                    <div>
                      <div style={HEADER_LABEL_STYLE}>Place of Supply</div>
                      <div style={DETAIL_TEXT_STYLE}>{buyer.placeOfSupply}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isCreditNote && (
            <div
              style={{
                marginBottom: "14px",
                borderRadius: "4px",
                border: "1px solid #fecaca",
                backgroundColor: "#fef2f2",
                padding: "8px 12px",
                fontSize: "9.5px",
              }}
            >
              <div style={{ fontWeight: 600, color: "#991b1b", marginBottom: "3px" }}>
                Against Invoice No: {invoice.linkedInvoiceNumber || "—"} dated {formatDate(invoice.linkedInvoiceDate)}
              </div>
              {invoice.creditReason && <div style={{ color: "#7f1d1d" }}>Reason: {invoice.creditReason}</div>}
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
                  {buildAddressLines(shipping.address).map((line, index) => (
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
                {isProforma ? (
                  <>
                    <col style={{ width: "34px" }} />
                    <col style={{ width: "44px" }} />
                    <col style={{ width: "46px" }} />
                    <col style={{ width: "42px" }} />
                    <col style={{ width: "52px" }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: "34px" }} />
                    <col style={{ width: "34px" }} />
                    <col style={{ width: "46px" }} />
                    <col style={{ width: "52px" }} />
                    <col style={{ width: "30px" }} />
                  </>
                )}
                {!isProforma && isCGST && <col style={{ width: "42px" }} />}
                {!isProforma && isCGST && <col style={{ width: "42px" }} />}
                {!isProforma && isIGST && <col style={{ width: "46px" }} />}
                <col style={{ width: "52px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "5px 4px", textAlign: "left" }}>Description of Service</th>
                  {isProforma ? (
                    <>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Unit</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Disc%</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: "5px 4px", textAlign: "center" }}>SAC</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
                      <th style={{ padding: "5px 4px", textAlign: "right" }}>Taxable</th>
                      <th style={{ padding: "5px 4px", textAlign: "center" }}>GST%</th>
                    </>
                  )}
                  {!isProforma && isCGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>CGST</th>}
                  {!isProforma && isCGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>SGST</th>}
                  {!isProforma && isIGST && <th style={{ padding: "5px 4px", textAlign: "right" }}>IGST</th>}
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>{isProforma ? "Amount" : "Total"}</th>
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
                      {isProforma ? (
                        <>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.quantity, 2)}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{item.unit || "—"}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.rate, 2)}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.discountPercent, 2)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "4px", textAlign: "center", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{item.hsnSac || "—"}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.quantity, 2)}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.rate, 2)}</td>
                          <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.taxableValue, 2)}</td>
                          <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>{item.gstRate}%</td>
                        </>
                      )}
                      {!isProforma && isCGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.cgst, 2)}</td>}
                      {!isProforma && isCGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.sgst, 2)}</td>}
                      {!isProforma && isIGST && <td style={{ padding: "4px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>{formatNumber(item.igst, 2)}</td>}
                      <td style={{ padding: "4px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{formatNumber(isProforma ? item.taxableValue : item.lineTotal, 2)}</td>
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
                      ...(isProforma ? [["Subtotal", totals.subtotal], ["Discount", totals.totalDiscount]] : [["Taxable Value", totals.totalTaxableValue]]),
                      ...(showTax && isCGST && totals.totalCGST > 0 ? [["CGST", totals.totalCGST]] : []),
                      ...(showTax && isCGST && totals.totalSGST > 0 ? [["SGST / UTGST", totals.totalSGST]] : []),
                      ...(showTax && isIGST && totals.totalIGST > 0 ? [["IGST", totals.totalIGST]] : []),
                      ...(!isProforma && totals.cess > 0 ? [["Cess", totals.cess]] : []),
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
                  {showTdsSummary && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 10px",
                          borderTop: "1px solid #f3f4f6",
                          fontSize: "9.5px",
                          backgroundColor: "#faf5ff",
                        }}
                      >
                        <span style={{ color: "#6b7280" }}>
                          TDS Deductible ({invoice.tdsSection || "194J"} @ {formatNumber(invoice.tdsRate ?? 0, 2)}%)
                        </span>
                        <span style={{ color: "#7c3aed" }}>-{formatCurrencyINR(invoice.tdsAmount ?? 0)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 10px",
                          fontSize: "9.5px",
                          backgroundColor: "#faf5ff",
                        }}
                      >
                        <span style={{ color: "#6b7280" }}>Net Payable After TDS</span>
                        <span style={{ color: "#111827", fontWeight: 600 }}>{formatCurrencyINR(netPayableAfterTds)}</span>
                      </div>
                    </>
                  )}
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

        <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "14px", marginTop: "16px" }}>
          <div className="print-keep-together" style={{ marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={HEADER_LABEL_STYLE}>Bank / Payment Details</div>
                <div style={DETAIL_TEXT_STYLE}>
                  {(bank ? (
                    <>
                      {bank.accountName && <div><span style={{ fontWeight: 600 }}>Account Name:</span> {bank.accountName}</div>}
                      {bank.bankName && <div><span style={{ fontWeight: 600 }}>Bank:</span> {bank.bankName}</div>}
                      {bank.accountNumber && <div><span style={{ fontWeight: 600 }}>Account No.:</span> {bank.accountNumber}</div>}
                      {bank.branch && <div><span style={{ fontWeight: 600 }}>Branch:</span> {bank.branch}</div>}
                      {bank.ifscCode && <div><span style={{ fontWeight: 600 }}>IFSC:</span> {bank.ifscCode}</div>}
                      {bank.upiId && <div><span style={{ fontWeight: 600 }}>UPI:</span> {bank.upiId}</div>}
                    </>
                  ) : (
                    <>
                      <div><span style={{ fontWeight: 600 }}>Account Name:</span> {DI_BANK.accountName}</div>
                      <div><span style={{ fontWeight: 600 }}>Bank:</span> {DI_BANK.bankName}</div>
                      <div><span style={{ fontWeight: 600 }}>Account No.:</span> {DI_BANK.accountNumber}</div>
                      <div><span style={{ fontWeight: 600 }}>Branch:</span> {DI_BANK.branch}</div>
                      <div><span style={{ fontWeight: 600 }}>IFSC:</span> {DI_BANK.ifscCode}</div>
                      <div><span style={{ fontWeight: 600 }}>MICR:</span> {DI_BANK.micr}</div>
                    </>
                  ))}
                </div>
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
              <div style={HEADER_LABEL_STYLE}>Notes &amp; Terms</div>
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

          {isProforma && (
            <div style={{ fontSize: "9px", color: "#6b7280", marginBottom: "14px" }}>
              This is a proforma invoice and not a GST tax invoice. No GST liability arises on this document.
            </div>
          )}

          {!isCreditNote && (invoice.creditNoteRefs?.length ?? 0) > 0 && (
            <div className="print-keep-together" style={{ marginBottom: "14px", fontSize: "9px", color: "#374151" }}>
              <div style={HEADER_LABEL_STYLE}>Credit Notes Issued</div>
              <div>Credit Notes Issued: {(invoice.creditNoteRefs ?? []).map((ref) => ref.creditNoteNumber).join(", ")}</div>
              <div>Total Credits: {formatCurrencyINR(getCreditNotesTotal(invoice))}</div>
              <div>Net Outstanding: {formatCurrencyINR(getEffectiveOutstanding(invoice))}</div>
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
                {!isProforma && invoice.irnQrImageBase64 && !signature.signatureImageBase64 && (
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
