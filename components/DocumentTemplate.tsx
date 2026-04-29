"use client";

import React from "react";
import { formatCurrencyINR, formatDate, formatNumber } from "@/lib/utils/formatting";

const BRAND_PURPLE = "#2828b0";
const BRAND_TEAL = "#00e5cc";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1.2px",
  textTransform: "uppercase",
  color: "#6b7280",
  marginBottom: "8px",
};

const DETAIL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "#374151",
  lineHeight: 1.55,
};

const META_VALUE_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#111827",
  textAlign: "right",
};

export type DocumentType =
  | "tax_invoice"
  | "bill_of_supply"
  | "export_invoice"
  | "credit_note"
  | "debit_note"
  | "purchase_order"
  | "proforma";

export type GSTMode = "cgst_sgst" | "igst" | "none" | "custom";

export interface DocumentTemplateProps {
  documentType: DocumentType;
  status: "draft" | "final";
  isGeneratingPDF: boolean;

  from: {
    logo: string | null;
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    phone: string;
    email: string;
  };

  billTo: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string | null;
  };

  docDetails: {
    number: string;
    date: string;
    dueDate?: string;
    validUntil?: string;
    deliveryDate?: string;
    poReference?: string;
    eWayBill?: string;
    projectDescription?: string;
    placeOfSupply: string;
  };

  lineItems: Array<{
    description: string;
    hsnSac: string;
    qty: number;
    unit: string;
    rate: number;
    discountPercent: number;
    gstPercent: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  }>;

  totals: {
    subtotal: number;
    totalDiscount: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    otherCharges: number;
    grandTotal: number;
    amountInWords: string;
    gstMode: GSTMode;
  };

  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string;
    upiId?: string;
  } | null;

  termsAndConditions: string;
  notes: string;
  declaration?: string;

  signatory: {
    name: string;
    designation?: string;
    signatureImage?: string | null;
  };

  footer: {
    email: string;
    phone: string;
    tagline: string;
  };
}

function buildAddressLines(
  a1: string,
  a2: string,
  city: string,
  state: string,
  pincode: string
): string[] {
  const cityLine = [city, state, pincode].filter(Boolean).join(", ");
  return [a1, a2, cityLine].filter(Boolean);
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "4px",
      }}
    >
      <span style={{ ...DETAIL_STYLE, color: "#6b7280" }}>{label}</span>
      <span style={META_VALUE_STYLE}>{value}</span>
    </div>
  );
}

const DOCUMENT_TITLES: Record<DocumentType, string> = {
  tax_invoice: "TAX INVOICE",
  bill_of_supply: "BILL OF SUPPLY",
  export_invoice: "EXPORT INVOICE",
  credit_note: "CREDIT NOTE",
  debit_note: "DEBIT NOTE",
  proforma: "PROFORMA INVOICE",
  purchase_order: "PURCHASE ORDER",
};

export function DocumentTemplate({
  documentType,
  status,
  isGeneratingPDF,
  from,
  billTo,
  docDetails,
  lineItems,
  totals,
  bankDetails,
  termsAndConditions,
  notes,
  declaration,
  signatory,
  footer,
}: DocumentTemplateProps) {
  const isPO = documentType === "purchase_order";
  const isProforma = documentType === "proforma";
  const isCreditNote = documentType === "credit_note";

  const isCGST = !isPO && totals.gstMode === "cgst_sgst";
  const isIGST = !isPO && totals.gstMode === "igst";
  const showTax = !isProforma && totals.gstMode !== "none";

  const title = DOCUMENT_TITLES[documentType];
  const subtitle = isPO
    ? "Procurement / Vendor Confirmation"
    : "Design Consultancy / Creative Services";

  const fromLines = buildAddressLines(
    from.address1,
    from.address2,
    from.city,
    from.state,
    from.pincode
  );
  const billToLines = buildAddressLines(
    billTo.address1,
    billTo.address2,
    billTo.city,
    billTo.state,
    billTo.pincode
  );

  const footerContact = [footer.email, footer.phone].filter(Boolean).join(" | ");

  const numberLabel = isPO
    ? "PO No."
    : isCreditNote
      ? "Credit Note No."
      : isProforma
        ? "Proforma No."
        : "Invoice No.";

  const dateLabel = isPO ? "PO Date" : "Date";

  const dueDateLabel = isProforma ? "Valid Until" : isPO ? "Delivery Date" : "Due Date";
  const dueDateValue = isProforma
    ? docDetails.validUntil
    : isPO
      ? docDetails.deliveryDate
      : docDetails.dueDate;

  // Invoice table column count for empty-state colspan
  const invoiceColCount =
    5 + (isCGST ? 2 : 0) + (isIGST ? 1 : 0) + (showTax ? 1 : 0);

  return (
    <div
      style={{
        fontFamily: '"Inter", Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        margin: 0,
        padding: 0,
      }}
    >
      {/* ── Header strip ── */}
      <div
        style={{
          backgroundColor: BRAND_PURPLE,
          width: "100%",
          padding: "20px 24px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "72px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: BRAND_TEAL,
              marginTop: "3px",
              letterSpacing: "0.3px",
            }}
          >
            {subtitle}
          </div>
          {status === "draft" && !isGeneratingPDF && (
            <span
              style={{
                display: "inline-block",
                marginTop: "6px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontSize: "8px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "10px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Draft
            </span>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Design Innsaeit"
          crossOrigin="anonymous"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
        />
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "16px 24px" }}>
        {isProforma && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "42%",
              transform: "translate(-50%, -50%) rotate(-24deg)",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "rgba(148, 163, 184, 0.18)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 0,
            }}
          >
            PROFORMA — NOT A TAX DOCUMENT
          </div>
        )}

        {/* ── Three-column header ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #d1d5db",
            marginBottom: "14px",
            paddingBottom: "14px",
          }}
        >
          {/* Column 1 — From */}
          <div style={{ borderRight: "1px solid #e5e7eb", paddingRight: "14px" }}>
            <div style={LABEL_STYLE}>From</div>
            {from.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={from.logo}
                alt={from.name}
                crossOrigin="anonymous"
                style={{
                  maxHeight: "38px",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "8px",
                  display: "block",
                }}
              />
            )}
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
              {from.name || "—"}
            </div>
            <div style={DETAIL_STYLE}>
              {fromLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div style={{ marginTop: "6px", ...DETAIL_STYLE }}>
              {from.gstin && (
                <div>
                  <span style={{ fontWeight: 600 }}>GSTIN:</span> {from.gstin}
                </div>
              )}
              {from.phone && (
                <div>
                  <span style={{ fontWeight: 600 }}>Phone:</span> {from.phone}
                </div>
              )}
              {from.email && (
                <div>
                  <span style={{ fontWeight: 600 }}>Email:</span> {from.email}
                </div>
              )}
            </div>
          </div>

          {/* Column 2 — Bill To */}
          <div style={{ borderRight: "1px solid #e5e7eb", padding: "0 14px" }}>
            <div style={LABEL_STYLE}>Bill To</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
              {billTo.name || "—"}
            </div>
            <div style={DETAIL_STYLE}>
              {billToLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div style={{ marginTop: "6px", ...DETAIL_STYLE }}>
              {billTo.gstin ? (
                <div>
                  <span style={{ fontWeight: 600 }}>GSTIN:</span> {billTo.gstin}
                </div>
              ) : (
                <div style={{ fontSize: "10px", color: "#6b7280" }}>Unregistered</div>
              )}
            </div>
          </div>

          {/* Column 3 — Doc Details */}
          <div style={{ paddingLeft: "14px" }}>
            <div style={LABEL_STYLE}>Doc Details</div>
            <MetaRow label={numberLabel} value={docDetails.number} />
            <MetaRow label={dateLabel} value={formatDate(docDetails.date)} />
            <MetaRow label={dueDateLabel} value={formatDate(dueDateValue)} />
            {!isPO && !isProforma && (
              <MetaRow label="PO Reference" value={docDetails.poReference} />
            )}
            {isPO && docDetails.poReference && (
              <MetaRow label="Quotation Ref." value={docDetails.poReference} />
            )}
            {!isProforma && !isPO && (
              <MetaRow label="E-Way Bill" value={docDetails.eWayBill} />
            )}
            {(docDetails.projectDescription || docDetails.placeOfSupply) && (
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "8px",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                {docDetails.projectDescription && (
                  <div style={{ marginBottom: "6px" }}>
                    <div style={LABEL_STYLE}>
                      {isPO ? "Project / Service For" : "Service / Project"}
                    </div>
                    <div style={DETAIL_STYLE}>{docDetails.projectDescription}</div>
                  </div>
                )}
                {docDetails.placeOfSupply && (
                  <div>
                    <div style={LABEL_STYLE}>Place of Supply</div>
                    <div style={DETAIL_STYLE}>{docDetails.placeOfSupply}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Line items table ── */}
        <div style={{ marginBottom: "14px" }}>
          {isPO ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9px",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "30px" }} />
                <col />
                <col style={{ width: "64px" }} />
                <col style={{ width: "46px" }} />
                <col style={{ width: "64px" }} />
                <col style={{ width: "76px" }} />
                <col style={{ width: "48px" }} />
                <col style={{ width: "76px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    Item / Service Description
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>HSN/SAC</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Taxable</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>GST%</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f3f4f6" }}
                    >
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "center",
                          color: "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb",
                          wordBreak: "break-word",
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "#111827" }}>
                          {item.description}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "center",
                          color: "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {item.hsnSac || "—"}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.qty, 2)}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.rate, 2)}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.taxableAmount, 2)}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.gstPercent, 2)}%
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          fontWeight: 600,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.total, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : isProforma ? (
            /* Proforma table */
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
                <col style={{ width: "44px" }} />
                <col style={{ width: "52px" }} />
                <col style={{ width: "42px" }} />
                <col style={{ width: "58px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "5px 4px", textAlign: "left" }}>
                    Description of Service
                  </th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Unit</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Disc%</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f5f3ff" }}
                    >
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          color: "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          borderBottom: "1px solid #e5e7eb",
                          wordBreak: "break-word",
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "#111827" }}>
                          {item.description}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.qty, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {item.unit || "—"}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.rate, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.discountPercent, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          fontWeight: 600,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.taxableAmount, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Standard invoice table */
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
                <col style={{ width: "52px" }} />
                <col style={{ width: "58px" }} />
                <col style={{ width: "30px" }} />
                {isCGST && <col style={{ width: "42px" }} />}
                {isCGST && <col style={{ width: "42px" }} />}
                {isIGST && <col style={{ width: "46px" }} />}
                <col style={{ width: "58px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "5px 4px", textAlign: "left" }}>
                    Description of Service
                  </th>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>SAC</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Taxable</th>
                  <th style={{ padding: "5px 4px", textAlign: "center" }}>GST%</th>
                  {isCGST && (
                    <th style={{ padding: "5px 4px", textAlign: "right" }}>CGST</th>
                  )}
                  {isCGST && (
                    <th style={{ padding: "5px 4px", textAlign: "right" }}>SGST</th>
                  )}
                  {isIGST && (
                    <th style={{ padding: "5px 4px", textAlign: "right" }}>IGST</th>
                  )}
                  <th style={{ padding: "5px 4px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={invoiceColCount}
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f5f3ff" }}
                    >
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          color: "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          borderBottom: "1px solid #e5e7eb",
                          wordBreak: "break-word",
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "#111827" }}>
                          {item.description}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          color: "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {item.hsnSac || "—"}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.qty, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.rate, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.taxableAmount, 2)}
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {item.gstPercent}%
                      </td>
                      {isCGST && (
                        <td
                          style={{
                            padding: "4px",
                            textAlign: "right",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {formatNumber(item.cgst, 2)}
                        </td>
                      )}
                      {isCGST && (
                        <td
                          style={{
                            padding: "4px",
                            textAlign: "right",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {formatNumber(item.sgst, 2)}
                        </td>
                      )}
                      {isIGST && (
                        <td
                          style={{
                            padding: "4px",
                            textAlign: "right",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {formatNumber(item.igst, 2)}
                        </td>
                      )}
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "right",
                          fontWeight: 600,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {formatNumber(item.total, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Totals ── */}
        <div className="print-keep-together" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                width: isPO ? "240px" : "220px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {(
                isPO
                  ? ([
                      ["Subtotal", totals.subtotal],
                      ["Discount", totals.totalDiscount],
                      ["Taxable Value", totals.taxableValue],
                      ["GST / Tax", totals.igst],
                      ...(totals.otherCharges > 0
                        ? [["Other Charges", totals.otherCharges]]
                        : []),
                    ] as [string, number][])
                  : ([
                      ...(isProforma
                        ? [
                            ["Subtotal", totals.subtotal],
                            ["Discount", totals.totalDiscount],
                          ]
                        : [["Taxable Value", totals.taxableValue]]),
                      ...(showTax && isCGST && totals.cgst > 0
                        ? [["CGST", totals.cgst]]
                        : []),
                      ...(showTax && isCGST && totals.sgst > 0
                        ? [["SGST / UTGST", totals.sgst]]
                        : []),
                      ...(showTax && isIGST && totals.igst > 0
                        ? [["IGST", totals.igst]]
                        : []),
                      ...(totals.cess > 0 ? [["Cess", totals.cess]] : []),
                      ...(totals.otherCharges > 0
                        ? [["Other Charges", totals.otherCharges]]
                        : []),
                    ] as [string, number][])
              ).map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: isPO ? "5px 12px" : "4px 10px",
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
                  padding: isPO ? "7px 12px" : "6px 10px",
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
            isPO ? (
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
            ) : (
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
                <span style={{ fontWeight: 600, color: BRAND_PURPLE }}>
                  Amount in Words:{" "}
                </span>
                <span style={{ color: "#374151", fontStyle: "italic" }}>
                  {totals.amountInWords}
                </span>
              </div>
            )
          )}
        </div>

        {/* ── Bottom section ── */}
        <div
          style={{
            borderTop: "1px solid #d1d5db",
            paddingTop: "14px",
            marginTop: "8px",
          }}
        >
          {/* Bank details */}
          {bankDetails && (
            <div className="print-keep-together" style={{ marginBottom: "14px" }}>
              <div style={LABEL_STYLE}>Bank / Payment Details</div>
              <div style={DETAIL_STYLE}>
                {bankDetails.accountName && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Account Name:</span>{" "}
                    {bankDetails.accountName}
                  </div>
                )}
                {bankDetails.bankName && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Bank:</span> {bankDetails.bankName}
                  </div>
                )}
                {bankDetails.accountNumber && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Account No.:</span>{" "}
                    {bankDetails.accountNumber}
                  </div>
                )}
                {bankDetails.branch && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Branch:</span> {bankDetails.branch}
                  </div>
                )}
                {bankDetails.ifsc && (
                  <div>
                    <span style={{ fontWeight: 600 }}>IFSC:</span> {bankDetails.ifsc}
                  </div>
                )}
                {bankDetails.upiId && (
                  <div>
                    <span style={{ fontWeight: 600 }}>UPI:</span> {bankDetails.upiId}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proforma disclaimer */}
          {isProforma && (
            <div style={{ fontSize: "9px", color: "#6b7280", marginBottom: "14px" }}>
              This is a proforma invoice and not a GST tax invoice. No GST liability
              arises on this document.
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="print-keep-together" style={{ marginBottom: "10px" }}>
              <div style={LABEL_STYLE}>Notes</div>
              <div style={{ fontSize: "9px", color: "#374151", whiteSpace: "pre-line" }}>
                {notes}
              </div>
            </div>
          )}

          {/* Terms */}
          {termsAndConditions && (
            <div className="print-keep-together" style={{ marginBottom: "10px" }}>
              <div style={LABEL_STYLE}>Terms &amp; Conditions</div>
              <div style={{ fontSize: "9px", color: "#374151" }}>
                {termsAndConditions}
              </div>
            </div>
          )}

          {/* Declaration */}
          {declaration && (
            <div className="print-keep-together" style={{ marginBottom: "10px" }}>
              <div style={LABEL_STYLE}>Declaration</div>
              <div style={{ fontSize: "9px", color: "#374151" }}>{declaration}</div>
            </div>
          )}

          {/* Signatory */}
          {(signatory.name || signatory.signatureImage) && (
            <div
              style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}
            >
              <div
                style={{
                  textAlign: "center",
                  minWidth: "160px",
                  fontSize: "9.5px",
                }}
              >
                {signatory.signatureImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signatory.signatureImage}
                    alt="Signature"
                    crossOrigin="anonymous"
                    style={{
                      height: "36px",
                      width: "auto",
                      objectFit: "contain",
                      marginBottom: "4px",
                      display: "block",
                      margin: "0 auto 4px",
                    }}
                  />
                )}
                <div
                  style={{
                    borderTop: `1px solid ${BRAND_PURPLE}`,
                    paddingTop: "4px",
                    marginTop: "2px",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    {signatory.name || "Authorized Signatory"}
                  </div>
                  {signatory.designation && (
                    <div style={{ color: "#6b7280", fontSize: "9px" }}>
                      {signatory.designation}
                    </div>
                  )}
                  <div style={{ color: "#6b7280", fontSize: "9px" }}>{from.name}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div
        style={{
          backgroundColor: BRAND_PURPLE,
          width: "100%",
          padding: "12px 24px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {["★", "★", "★"].map((s, i) => (
            <span key={i} style={{ color: BRAND_TEAL, fontSize: "10px" }}>
              {s}
            </span>
          ))}
          <div
            style={{
              width: "120px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.3)",
              marginLeft: "6px",
            }}
          />
        </div>
        <div style={{ textAlign: "right" }}>
          {footerContact && (
            <div
              style={{
                fontSize: "9px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
              }}
            >
              {footerContact}
            </div>
          )}
          {footer.tagline && (
            <div
              style={{
                fontSize: "8px",
                color: "rgba(255,255,255,0.6)",
                marginTop: "2px",
              }}
            >
              {footer.tagline}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
