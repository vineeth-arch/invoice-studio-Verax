"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { A4PreviewWrapper } from "@/components/document/A4PreviewWrapper";
import { PDFExportButton } from "@/components/document/PDFExportButton";
import { PrintButton } from "@/components/document/PrintButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/lib/hooks/useToast";
import { documentNumberingRepository } from "@/lib/repositories/documentNumberingRepository";
import { clearInvoiceConversionDraft, getInvoiceConversionDraft } from "@/lib/storage/local";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import type { Invoice } from "@/lib/types/invoice";
import type { GSTMode } from "@/lib/types/common";
import { calculateLineItem, calculateInvoiceTotals } from "@/lib/utils/calculations";

interface InvoiceEditorPageProps {
  invoiceId?: string;
}

const SPLIT_RATIO_KEY = "invoice_split_ratio";
const DEFAULT_SPLIT_RATIO = 0.5;
const MIN_FORM_WIDTH = 380;
const MIN_PREVIEW_WIDTH = 320;

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice>>({});
  const [conversionDraft, setConversionDraft] = useState<Partial<Invoice> | null>(null);
  const [draftReady, setDraftReady] = useState(Boolean(invoiceId));
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareActionLoading, setIsShareActionLoading] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isDesktop, setIsDesktop] = useState(false);

  const { invoices, loading: invoicesLoading, saveInvoice, getInvoice } = useInvoices();
  const { purchaseOrders } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const { addToast } = useToast();

  const existingInvoice = invoiceId ? getInvoice(invoiceId) : undefined;
  const initialInvoice = existingInvoice ?? conversionDraft ?? undefined;
  const allDocs = [...invoices, ...purchaseOrders];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    const stored = Number(window.localStorage.getItem(SPLIT_RATIO_KEY));
    if (!Number.isNaN(stored) && stored > 0 && stored < 1) setSplitRatio(stored);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (invoiceId || typeof window === "undefined") { setDraftReady(true); return; }
    const draft = getInvoiceConversionDraft();
    setConversionDraft(draft);
    clearInvoiceConversionDraft();
    setDraftReady(true);
  }, [invoiceId]);

  useEffect(() => {
    setShareToken(existingInvoice?.shareToken ?? "");
  }, [existingInvoice?.shareToken]);

  const handleSave = useCallback(async (values: InvoiceFormValues, status: "DRAFT" | "FINAL") => {
    setIsSaving(true);
    try {
      const items = values.lineItems.map((item) =>
        calculateLineItem(
          { ...item, quantity: Number(item.quantity), rate: Number(item.rate), discountPercent: Number(item.discountPercent), gstRate: Number(item.gstRate) },
          values.gstMode as GSTMode
        )
      );
      const totals = calculateInvoiceTotals(items, Number(values.cess) || 0, Number(values.otherCharges) || 0);
      const invoice = {
        ...existingInvoice,
        ...(values as unknown as Partial<Invoice>),
        id: existingInvoice?.id ?? invoiceId,
        lineItems: items,
        totals,
        cess: Number(values.cess) || 0,
        otherCharges: Number(values.otherCharges) || 0,
        status,
        shareToken: existingInvoice?.shareToken,
      } as Partial<Invoice>;
      const result = await saveInvoice(invoice);
      if (result.success) {
        if (!existingInvoice && !invoiceId) await documentNumberingRepository.incrementInvoiceSequence();
        addToast(`Invoice ${status === "DRAFT" ? "saved as draft" : "finalized"} successfully!`, "success");
        if (result.id && !invoiceId) router.push(`/invoice/${result.id}/edit`);
      } else {
        addToast(result.error ?? "Failed to save invoice.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [existingInvoice, invoiceId, saveInvoice, addToast, router]);

  const copyToClipboard = useCallback(async (url: string) => {
    try { await window.navigator.clipboard.writeText(url); return true; } catch { return false; }
  }, []);

  const buildShareUrl = useCallback((token: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }, []);

  const handleShare = useCallback(async () => {
    if (!existingInvoice) return;
    setIsShareActionLoading(true);
    try {
      let token = existingInvoice.shareToken || shareToken;
      if (!token) {
        token = uuidv4();
        const result = await saveInvoice({ ...existingInvoice, shareToken: token });
        if (!result.success) { addToast(result.error ?? "Failed to create share link.", "error"); return; }
      }
      setShareToken(token);
      const url = buildShareUrl(token);
      setShareUrl(url);
      setIsShareModalOpen(true);
      const copied = await copyToClipboard(url);
      addToast(copied ? "Link copied" : "Share link ready to copy.", copied ? "success" : "info");
    } finally { setIsShareActionLoading(false); }
  }, [addToast, buildShareUrl, copyToClipboard, existingInvoice, saveInvoice, shareToken]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    const copied = await copyToClipboard(shareUrl);
    addToast(copied ? "Link copied" : "Copy failed.", copied ? "success" : "error");
  }, [addToast, copyToClipboard, shareUrl]);

  const handleRevokeShareLink = useCallback(async () => {
    if (!existingInvoice || !shareToken) return;
    setIsShareActionLoading(true);
    try {
      const result = await saveInvoice({ ...existingInvoice, shareToken: undefined });
      if (!result.success) { addToast(result.error ?? "Failed to revoke share link.", "error"); return; }
      setShareToken(""); setShareUrl(""); setIsShareModalOpen(false);
      addToast("Share link revoked.", "success");
    } finally { setIsShareActionLoading(false); }
  }, [addToast, existingInvoice, saveInvoice, shareToken]);

  const startSplitDrag = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const container = splitPaneRef.current;
    if (!container) return;
    event.preventDefault();
    const { left, width } = container.getBoundingClientRect();
    const minRatio = MIN_FORM_WIDTH / width;
    const maxRatio = (width - MIN_PREVIEW_WIDTH) / width;
    let currentRatio = splitRatio;
    const onMove = (e: MouseEvent) => {
      const nextRatio = Math.min(maxRatio, Math.max(minRatio, (e.clientX - left) / width));
      currentRatio = nextRatio;
      setSplitRatio(nextRatio);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.localStorage.setItem(SPLIT_RATIO_KEY, String(currentRatio));
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [isDesktop, splitRatio]);

  const pdfFilename = `INV-${previewInvoice.invoiceNumber ?? "draft"}-${previewInvoice.buyer?.name ?? "client"}`;
  const canShare = existingInvoice?.status === "FINAL";

  if (!draftReady || (invoiceId && invoicesLoading)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading invoice editor…
      </div>
    );
  }
  if (invoiceId && !existingInvoice) {
    return (
      <div className="flex h-screen items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* ── Editor top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0 no-print"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <h1
            className="font-display font-bold text-[18px] leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {existingInvoice ? `Edit Invoice — ${existingInvoice.invoiceNumber}` : "New Invoice"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fill the form on the left · preview on the right
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canShare && (
            <Button variant="outline" onClick={handleShare} loading={isShareActionLoading}>
              Share
            </Button>
          )}
          <PDFExportButton previewRef={previewRef} filename={pdfFilename} />
          <PrintButton contentRef={previewRef} />
        </div>
      </div>

      {/* ── Mobile tab switcher ── */}
      <div
        className="flex shrink-0 no-print lg:hidden"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {(["form", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--accent-yellow)" : "var(--text-secondary)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-yellow)" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Split pane ── */}
      <div ref={splitPaneRef} className="flex flex-1 overflow-hidden">
        {/* Form panel */}
        <div
          className={`${activeTab === "preview" ? "hidden" : "flex"} w-full flex-col overflow-y-auto no-print lg:flex lg:min-w-[380px]`}
          style={isDesktop ? { flexBasis: `${splitRatio * 100}%`, background: "var(--bg)" } : { background: "var(--bg)" }}
        >
          <div className="space-y-3 p-4">
            <InvoiceForm
              initialValues={initialInvoice}
              settings={settings}
              companyProfile={profile}
              existingDocs={allDocs}
              onSave={handleSave}
              isSaving={isSaving}
              onPreviewChange={setPreviewInvoice}
            />
          </div>
        </div>

        {/* Drag divider */}
        <div
          className="hidden w-4 shrink-0 cursor-col-resize items-center justify-center no-print lg:flex transition-colors"
          style={{ background: "var(--bg)" }}
          onMouseDown={startSplitDrag}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
        >
          <div
            className="h-10 w-1 rounded-full transition-colors"
            style={{ background: "var(--border-strong)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-yellow)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--border-strong)"; }}
          />
        </div>

        {/* Preview panel — always white, theme-immune */}
        <div
          className={`${activeTab === "form" ? "hidden" : "flex"} w-full flex-col overflow-y-auto p-5 lg:flex lg:min-w-[320px]`}
          style={isDesktop ? { flexBasis: `${(1 - splitRatio) * 100}%`, background: "#E8E8E4" } : { background: "#E8E8E4" }}
        >
          {/* Device-frame wrapper */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
            style={{ maxWidth: 820, background: "#FFFFFF" }}
          >
            <A4PreviewWrapper ref={previewRef} noPadding>
              <div className="pdf-preview-surface">
                <InvoicePreview invoice={previewInvoice} />
              </div>
            </A4PreviewWrapper>
          </div>
        </div>
      </div>

      {/* Share modal */}
      <Modal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Invoice sharing"
        actions={
          <>
            {shareToken && (
              <Button variant="destructive" onClick={handleRevokeShareLink} loading={isShareActionLoading}>
                Revoke link
              </Button>
            )}
            <Button variant="outline" onClick={handleCopyShareLink}>Copy link</Button>
            <Button onClick={() => setIsShareModalOpen(false)}>Close</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p
            className="rounded-xl px-3 py-2 text-xs"
            style={{ background: "var(--accent-yellow-muted)", color: "var(--accent-yellow-text)" }}
          >
            Local storage mode: share link works only on this browser/device until Supabase is connected.
          </p>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Share URL
            </div>
            <div
              className="break-all rounded-xl px-3 py-2 text-sm font-mono"
              style={{ border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-secondary)" }}
            >
              {shareUrl || "Share link will appear here."}
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Revoking clears the share token and immediately invalidates the current URL.
          </p>
        </div>
      </Modal>
    </div>
  );
}
