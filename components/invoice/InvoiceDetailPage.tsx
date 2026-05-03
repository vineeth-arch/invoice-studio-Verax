"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import {
  Mail,
  Download,
  Printer,
  Link2,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { SendEmailModal } from "@/components/document/SendEmailModal";
import { InvoicePreview } from "./InvoicePreview";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuCard, NeuGroove } from "@/components/ui/neu-card";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useToast } from "@/lib/hooks/useToast";
import {
  buildShareUrl,
  buildWhatsappMessage,
  buildWhatsappUrl,
} from "@/lib/utils/documentSharing";
import {
  getDisplayInvoiceNumber,
  isProformaInvoice,
} from "@/lib/utils/invoiceTypes";
import { formatDate, formatCurrencyINR } from "@/lib/utils/formatting";
import { downloadPdf } from "@/lib/utils/pdf";
import type { Invoice } from "@/lib/types/invoice";
import type { PaymentStatus } from "@/lib/types/common";

interface InvoiceDetailPageProps {
  invoiceId: string;
}

/* ─────────────────────────────────────────────
   Sub-component: Large Payment Status Toggle
   64 × 32 px — physically sliding neumorphic thumb
───────────────────────────────────────────── */
interface PaymentToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function PaymentStatusToggle({
  checked,
  onChange,
  disabled = false,
}: PaymentToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      style={{
        position: "relative",
        width: "64px",
        height: "32px",
        borderRadius: "16px",
        backgroundColor: checked ? "var(--base-mid)" : "var(--base)",
        boxShadow: "var(--shadow-inset-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        userSelect: "none",
        transition: "background-color 200ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "4px",
          left: "4px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "var(--base)",
          boxShadow: checked
            ? `0 0 0 3px var(--paid-glow), var(--shadow-knob)`
            : "var(--shadow-knob)",
          transform: checked ? "translateX(32px)" : "translateX(0)",
          transition: checked
            ? "transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 200ms ease"
            : "transform 170ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 170ms ease",
          willChange: "transform",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-component: Status Timeline
   Vertical amber line · 4 event dots
───────────────────────────────────────────── */
interface TimelineEvent {
  label: string;
  date: string | undefined;
  done: boolean;
  accentColor?: string;
}

function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: "28px" }}>
      {/* Amber vertical thread */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "6px",
          top: "8px",
          bottom: "8px",
          width: "1px",
          backgroundColor: "rgba(196, 125, 26, 0.3)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {events.map(({ label, date, done, accentColor }, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            {/* Dot — raised + filled if done, inset + empty if pending */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-22px",
                top: "1px",
                width: "13px",
                height: "13px",
                borderRadius: "50%",
                backgroundColor: done
                  ? accentColor ?? "var(--accent)"
                  : "var(--base)",
                boxShadow: done
                  ? `0 0 0 2px var(--base), var(--shadow-soft)`
                  : "var(--shadow-inset-sm)",
                flexShrink: 0,
              }}
            />

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span
                style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: "11px",
                  fontWeight: done ? 600 : 400,
                  color: done ? "var(--text)" : "var(--muted)",
                  lineHeight: 1.4,
                }}
              >
                {label}
              </span>
              {date && (
                <span
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "10px",
                    color: "var(--muted)",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.3,
                  }}
                >
                  {formatDate(date)}
                </span>
              )}
              {!done && !date && (
                <span
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "10px",
                    color: "var(--muted-light)",
                    lineHeight: 1.3,
                  }}
                >
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main: InvoiceDetailPage
───────────────────────────────────────────── */
export function InvoiceDetailPage({ invoiceId }: InvoiceDetailPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isShareActionLoading, setIsShareActionLoading] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [paymentToggleLoading, setPaymentToggleLoading] = useState(false);

  const { loading: invoicesLoading, saveInvoice, getInvoice } = useInvoices();
  const { profile } = useCompanyProfile();
  const { addToast } = useToast();

  const invoice = getInvoice(invoiceId);

  useEffect(() => {
    if (!invoice?.shareToken) {
      setShareToken("");
      setShareUrl("");
      return;
    }
    setShareToken(invoice.shareToken);
    if (typeof window !== "undefined") {
      setShareUrl(buildShareUrl(window.location.origin, invoice.shareToken));
    }
  }, [invoice?.shareToken]);

  /* ── PDF download ── */
  const handleDownloadPDF = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;
    setIsGeneratingPDF(true);
    try {
      const filename = `INV-${invoice?.invoiceNumber ?? "draft"}-${invoice?.buyer?.name ?? "client"}`;
      await downloadPdf(el, filename);
    } catch {
      addToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [addToast, invoice?.invoiceNumber, invoice?.buyer?.name]);

  /* ── Print ── */
  const handlePrint = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const origTransform = el.style.transform;
    el.style.transform = "none";
    window.print();
    setTimeout(() => {
      el.style.transform = origTransform;
    }, 500);
  }, []);

  /* ── Share link helpers ── */
  const ensureShareLink = useCallback(async () => {
    if (!invoice || typeof window === "undefined") return null;
    let token = invoice.shareToken ?? shareToken;
    if (!token) {
      token = uuidv4();
      const result = await saveInvoice({ ...invoice, shareToken: token });
      if (!result.success) {
        addToast(result.error ?? "Failed to create share link.", "error");
        return null;
      }
    }
    const url = buildShareUrl(window.location.origin, token);
    setShareToken(token);
    setShareUrl(url);
    return { token, url };
  }, [addToast, invoice, saveInvoice, shareToken]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleShareLink = useCallback(async () => {
    if (!invoice) return;
    setIsShareActionLoading(true);
    try {
      const link = await ensureShareLink();
      if (!link) return;
      const copied = await copyToClipboard(link.url);
      addToast(
        copied ? "Link copied to clipboard" : "Share link ready",
        copied ? "success" : "info"
      );
    } finally {
      setIsShareActionLoading(false);
    }
  }, [addToast, copyToClipboard, ensureShareLink, invoice]);

  const handleWhatsappShare = useCallback(async () => {
    if (!invoice || typeof window === "undefined") return;
    setIsShareActionLoading(true);
    try {
      const link = await ensureShareLink();
      if (!link) return;
      const message = buildWhatsappMessage(
        { type: "invoice", document: invoice },
        profile?.companyName ?? invoice.supplier?.name ?? "your company",
        link.url
      );
      window.open(buildWhatsappUrl(message), "_blank", "noopener,noreferrer");
    } finally {
      setIsShareActionLoading(false);
    }
  }, [ensureShareLink, invoice, profile?.companyName]);

  /* ── Payment status toggle ── */
  const handlePaymentToggle = useCallback(
    async (paid: boolean) => {
      if (!invoice) return;
      setPaymentToggleLoading(true);
      try {
        const newStatus: PaymentStatus = paid ? "Paid" : "Unpaid";
        const result = await saveInvoice({
          ...invoice,
          paymentStatus: newStatus,
          ...(paid && !invoice.paymentReceivedDate
            ? { paymentReceivedDate: new Date().toISOString().slice(0, 10) }
            : {}),
        } as Invoice);
        if (!result.success) {
          addToast(result.error ?? "Failed to update payment status.", "error");
        } else {
          addToast(paid ? "Marked as Paid" : "Marked as Unpaid", "success");
        }
      } finally {
        setPaymentToggleLoading(false);
      }
    },
    [addToast, invoice, saveInvoice]
  );

  /* ── Loading / Not-found states ── */
  if (invoicesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-label" style={{ color: "var(--muted)" }}>
          Loading invoice…
        </span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <span className="text-label" style={{ color: "var(--muted)" }}>
          Invoice not found
        </span>
        <NeuButton onClick={() => router.push("/dashboard")}>
          <ArrowLeft size={13} />
          Back to Dashboard
        </NeuButton>
      </div>
    );
  }

  /* ── Derived state ── */
  const isPaid = invoice.paymentStatus === "Paid";
  const isOverdue = invoice.paymentStatus === "Overdue";
  const isDraft = invoice.status === "DRAFT";
  const canShare = invoice.status === "FINAL";

  // Stamp
  const stampStatus: "paid" | "overdue" | "draft" | null = isDraft
    ? "draft"
    : isPaid
    ? "paid"
    : isOverdue
    ? "overdue"
    : null;
  const stampLabel = stampStatus === "paid"
    ? "PAID"
    : stampStatus === "overdue"
    ? "OVERDUE"
    : stampStatus === "draft"
    ? "DRAFT"
    : "";

  // Status indicator for header badge
  const statusBadgeColor = isPaid
    ? "var(--paid)"
    : isOverdue
    ? "var(--overdue)"
    : isDraft
    ? "var(--draft)"
    : "var(--amber)";
  const statusBadgeData = isPaid
    ? "paid"
    : isOverdue
    ? "overdue"
    : isDraft
    ? "draft"
    : "amber";
  const statusBadgeText = isPaid
    ? "Paid"
    : isOverdue
    ? "Overdue"
    : isDraft
    ? "Draft"
    : invoice.paymentStatus ?? "Unpaid";

  // Timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      label: "Created",
      date: invoice.createdAt,
      done: true,
      accentColor: "var(--accent)",
    },
    {
      label: "Sent",
      date: invoice.lastEmailedAt,
      done: Boolean(invoice.lastEmailedAt),
      accentColor: "var(--amber)",
    },
    {
      label: "Viewed",
      date: undefined,
      done: false,
      accentColor: "var(--accent-mid)",
    },
    {
      label: "Paid",
      date: invoice.paymentReceivedDate,
      done: isPaid,
      accentColor: "var(--paid)",
    },
  ];

  const invoiceNumber = getDisplayInvoiceNumber(invoice);
  const pdfFilename = `INV-${invoice.invoiceNumber ?? "draft"}-${invoice.buyer?.name ?? "client"}`;
  const grandTotal = invoice.totals?.grandTotal ?? 0;
  const docType = isProformaInvoice(invoice) ? "proforma" : "invoice";

  const hasBankDetails = Boolean(
    invoice.paymentDetails?.accountName ||
      invoice.paymentDetails?.accountNumber ||
      invoice.paymentDetails?.bankName
  );

  /* ── Render ── */
  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ══ BRUSHED METAL HEADER ══ */}
      <header
        className="header-brushed flex items-center gap-3 px-5 shrink-0 no-print"
        style={{ zIndex: 10 }}
      >
        {/* Back */}
        <NeuButton
          variant="ghost"
          size="sm"
          aria-label="Back to Documents"
          className="gap-1"
          onClick={() => router.push("/documents")}
        >
          <ArrowLeft size={13} />
        </NeuButton>

        {/* Vertical groove separator */}
        <div
          aria-hidden="true"
          style={{
            width: "2px",
            height: "24px",
            background: "var(--base-dark)",
            boxShadow:
              "inset 1px 0 2px var(--shadow-dark), inset -1px 0 2px var(--shadow-light)",
            borderRadius: "1px",
            flexShrink: 0,
          }}
        />

        {/* Invoice number + status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col leading-none">
            <span
              className="text-label"
              style={{ color: "var(--muted)", marginBottom: "2px" }}
            >
              Invoice
            </span>
            <span
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {invoiceNumber}
            </span>
          </div>

          {/* Status badge — neumorphic inset pill */}
          <div
            className="nm-pressed-sm flex items-center gap-1.5 px-2.5"
            style={{ paddingTop: "5px", paddingBottom: "5px", borderRadius: "var(--r-sm)" }}
          >
            <span
              className="status-light"
              data-status={statusBadgeData}
            />
            <span
              className="text-label"
              style={{
                color: statusBadgeColor,
                marginBottom: 0,
              }}
            >
              {statusBadgeText}
            </span>
          </div>
        </div>

        {/* Amount — desktop only */}
        <div
          className="nm-pressed-sm hidden md:flex items-center px-3"
          style={{
            paddingTop: "6px",
            paddingBottom: "6px",
            borderRadius: "var(--r-sm)",
          }}
        >
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCurrencyINR(grandTotal)}
          </span>
        </div>

        {/* Client name — desktop only */}
        <span
          className="hidden lg:block text-label"
          style={{ color: "var(--muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 0 }}
        >
          {invoice.buyer?.name}
        </span>

        {/* Edit button */}
        <NeuButton
          variant="default"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push(`/invoice/${invoiceId}/edit`)}
        >
          <Pencil size={11} />
          Edit
        </NeuButton>
      </header>

      {/* ══ MAIN 2-COLUMN LAYOUT ══ */}
      <div
        className="flex flex-1 min-h-0"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        {/* ── LEFT: Document Well (65%) — hidden on mobile ── */}
        <div
          className="hidden lg:flex flex-col overflow-y-auto"
          style={{ flex: "0 0 65%" }}
        >
          {/* Cockpit screen well */}
          <div
            className="chart-cockpit flex-1 flex items-start justify-center p-8"
            style={{ minHeight: "100%" }}
          >
            {/* Relative wrapper for holes + stamp overlay */}
            <div
              style={{
                position: "relative",
                width: "fit-content",
                marginLeft: "18px",
              }}
            >
              {/* Three hole punches — left: -6px overlaps paper edge by ~6px */}
              <div className="verax-holes" aria-hidden="true" style={{ left: "-6px" }}>
                <span />
              </div>

              {/* A4 paper preview — ref used for PDF/print */}
              <A4PreviewWrapper ref={previewRef} noPadding>
                <InvoicePreview
                  invoice={invoice}
                  isGeneratingPDF={isGeneratingPDF}
                />
              </A4PreviewWrapper>

              {/* Status stamp overlay — bottom-right of paper */}
              {stampStatus && (
                <div
                  className="verax-stamp no-print"
                  data-status={stampStatus}
                  aria-hidden="true"
                  style={{
                    bottom: "14%",
                    right: "7%",
                    fontSize: "15px",
                    fontWeight: 900,
                    letterSpacing: "0.3em",
                    opacity: 0.82,
                    transform:
                      stampStatus === "draft"
                        ? "rotate(-8deg)"
                        : "rotate(-14deg)",
                  }}
                >
                  {stampLabel}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Vertical groove divider (desktop) ── */}
        <div
          aria-hidden="true"
          className="hidden lg:block flex-shrink-0"
          style={{
            width: "3px",
            background: "var(--base-dark)",
            boxShadow:
              "inset 1px 0 2px var(--shadow-dark), inset -1px 0 2px var(--shadow-light)",
          }}
        />

        {/* ── RIGHT: Action Sidebar (35% desktop / full mobile) ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--base)", boxShadow: "var(--shadow-raised)" }}
        >
          {/* Inner sticky container — scrolls within right column */}
          <div
            className="lg:max-w-none p-6 space-y-5"
            style={{
              // On desktop constrain to the 35% column
            }}
          >
            {/* ── Send Invoice (primary CTA) ── */}
            <NeuButton
              variant="accent"
              size="lg"
              className="w-full justify-center"
              onClick={() => setIsSendEmailModalOpen(true)}
              disabled={!canShare}
              title={canShare ? undefined : "Finalise the invoice before sending"}
            >
              <Mail size={14} />
              Send Invoice
            </NeuButton>

            {/* ── Secondary actions ── */}
            <div className="flex flex-col gap-2.5">
              <NeuButton
                variant="default"
                size="md"
                className="w-full justify-center"
                loading={isGeneratingPDF}
                onClick={() => void handleDownloadPDF()}
              >
                <Download size={13} />
                Download PDF
              </NeuButton>

              <NeuButton
                variant="default"
                size="md"
                className="w-full justify-center"
                loading={isShareActionLoading}
                onClick={() => void handleWhatsappShare()}
                disabled={!canShare}
              >
                <WhatsAppIcon />
                WhatsApp
              </NeuButton>

              <NeuButton
                variant="default"
                size="md"
                className="w-full justify-center"
                loading={isShareActionLoading}
                onClick={() => void handleShareLink()}
                disabled={!canShare}
              >
                <Link2 size={13} />
                Share Link
              </NeuButton>

              <NeuButton
                variant="ghost"
                size="md"
                className="w-full justify-center"
                onClick={handlePrint}
              >
                <Printer size={13} />
                Print
              </NeuButton>
            </div>

            <NeuGroove />

            {/* ── Payment Status Toggle ── */}
            <div>
              <p
                className="text-label"
                style={{ color: "var(--muted)", marginBottom: "14px" }}
              >
                Payment Status
              </p>
              <div className="flex items-center justify-between gap-4">
                {/* "Unpaid" label */}
                <span
                  style={{
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: "12px",
                    fontWeight: 600,
                    color: !isPaid ? "var(--overdue)" : "var(--muted-light)",
                    transition: "color 200ms ease",
                  }}
                >
                  Unpaid
                </span>

                <PaymentStatusToggle
                  checked={isPaid}
                  onChange={(v) => void handlePaymentToggle(v)}
                  disabled={paymentToggleLoading}
                />

                {/* "Paid" label */}
                <span
                  style={{
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isPaid ? "var(--paid)" : "var(--muted-light)",
                    transition: "color 200ms ease",
                  }}
                >
                  Paid
                </span>
              </div>
            </div>

            <NeuGroove />

            {/* ── Invoice Meta (neumorphic inset card) ── */}
            <NeuCard variant="inset" className="p-4">
              <div className="space-y-3">
                {[
                  {
                    label: "Created",
                    value: invoice.createdAt
                      ? formatDate(invoice.createdAt)
                      : "—",
                  },
                  {
                    label: "Sent",
                    value: invoice.lastEmailedAt
                      ? formatDate(invoice.lastEmailedAt)
                      : "—",
                  },
                  {
                    label: "Due Date",
                    value: invoice.dueDate ? formatDate(invoice.dueDate) : "—",
                  },
                  {
                    label: "Invoice Date",
                    value: invoice.invoiceDate
                      ? formatDate(invoice.invoiceDate)
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="text-label"
                      style={{
                        color: "var(--muted-light)",
                        marginBottom: 0,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "var(--text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </NeuCard>

            {/* ── Status Timeline ── */}
            <div>
              <p
                className="text-label"
                style={{ color: "var(--muted)", marginBottom: "16px" }}
              >
                Status Timeline
              </p>
              <StatusTimeline events={timelineEvents} />
            </div>

            {/* ── Payment Details (conditional) ── */}
            {hasBankDetails && (
              <NeuCard variant="inset" className="p-4">
                <p
                  className="text-label"
                  style={{ color: "var(--muted)", marginBottom: "12px" }}
                >
                  Payment Details
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      label: "Account Name",
                      value: invoice.paymentDetails?.accountName,
                    },
                    {
                      label: "Bank",
                      value: invoice.paymentDetails?.bankName,
                    },
                    {
                      label: "IFSC",
                      value: invoice.paymentDetails?.ifscCode,
                    },
                    {
                      label: "Account No",
                      value: invoice.paymentDetails?.accountNumber,
                    },
                  ]
                    .filter((f) => f.value)
                    .map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-3"
                      >
                        <span
                          className="text-label"
                          style={{
                            color: "var(--muted-light)",
                            marginBottom: 0,
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--text)",
                            textAlign: "right",
                            wordBreak: "break-all",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </NeuCard>
            )}

            {/* ── Mobile: document preview below actions ── */}
            <div className="block lg:hidden mt-2">
              <NeuGroove className="mb-5" />
              <p
                className="text-label"
                style={{ color: "var(--muted)", marginBottom: "12px" }}
              >
                Document Preview
              </p>
              {/* Cockpit screen well for mobile */}
              <div
                className="chart-cockpit p-3 rounded-panel overflow-hidden"
                style={{ borderRadius: "var(--r-panel)" }}
              >
                <A4PreviewWrapper noPadding>
                  <InvoicePreview invoice={invoice} isGeneratingPDF={false} />
                </A4PreviewWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SEND EMAIL MODAL ══ */}
      <SendEmailModal
        open={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        documentType={docType}
        invoiceNumber={invoiceNumber}
        clientName={invoice.buyer?.name ?? ""}
        clientEmail={invoice.buyer?.contact?.email}
        amount={grandTotal.toLocaleString("en-IN")}
        dueDate={invoice.dueDate}
        senderName={invoice.supplier?.name ?? ""}
        senderEmail={invoice.supplier?.contact?.email ?? ""}
        shareUrl={shareUrl || undefined}
        previewRef={previewRef}
        filename={pdfFilename}
      />
    </div>
  );
}
