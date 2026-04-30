"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { useEmailSettings } from "@/lib/hooks/useEmailSettings";
import { useToast } from "@/lib/hooks/useToast";
import { blobToBase64, generatePdfBlob } from "@/lib/utils/pdf";

export interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  documentType: "invoice" | "po" | "proforma";
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  amount: string;
  dueDate?: string;
  senderName: string;
  senderEmail: string;
  shareUrl?: string;
  previewRef: RefObject<HTMLDivElement>;
  filename: string;
}

function getDocumentLabel(documentType: SendEmailModalProps["documentType"]) {
  switch (documentType) {
    case "po":
      return "PO";
    case "proforma":
      return "Proforma";
    default:
      return "Invoice";
  }
}

export function SendEmailModal({
  open,
  onClose,
  documentType,
  invoiceNumber,
  clientName,
  clientEmail,
  amount,
  dueDate,
  senderName,
  senderEmail,
  shareUrl,
  previewRef,
  filename,
}: SendEmailModalProps) {
  const { settings: emailSettings, refresh } = useEmailSettings(senderName);
  const { addToast } = useToast();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);

  const effectiveSenderName = emailSettings.fromName.trim() || senderName;
  const effectiveSenderEmail = emailSettings.fromEmail.trim() || senderEmail;
  const documentLabel = useMemo(() => getDocumentLabel(documentType), [documentType]);
  const modalTitle = useMemo(() => `Send ${documentLabel} by Email`, [documentLabel]);
  const defaultSubject = useMemo(
    () => `${documentType} ${invoiceNumber} from ${effectiveSenderName} — ₹${amount}`,
    [amount, documentType, effectiveSenderName, invoiceNumber]
  );
  const defaultMessage = useMemo(() => {
    const lines = [
      `Dear ${clientName || "Client"},`,
      "",
      `Please find attached ${documentType} ${invoiceNumber} for ₹${amount}.`,
    ];

    if (dueDate) {
      lines.push("", `Payment is due by ${dueDate}.`);
    }

    if (shareUrl) {
      lines.push("", "You can also view this online at the link below.");
    }

    lines.push("", "Please feel free to reach out if you have any questions.", "", "Regards,", effectiveSenderName);

    if (emailSettings.emailSignature.trim()) {
      lines.push("", emailSettings.emailSignature.trim());
    }

    return lines.join("\n");
  }, [amount, clientName, documentType, dueDate, effectiveSenderName, emailSettings.emailSignature, invoiceNumber, shareUrl]);

  useEffect(() => {
    if (!open) return;

    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;

    setTo(clientEmail ?? "");
    setCc("");
    setSubject(defaultSubject);
    setMessage(defaultMessage);
    setAttachPdf(true);
  }, [clientEmail, defaultMessage, defaultSubject, open]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      addToast("Please fill in To, Subject, and Message.", "error");
      return;
    }

    setSending(true);
    try {
      let pdfBase64: string | undefined;
      if (attachPdf) {
        const previewElement = previewRef.current;
        if (!previewElement) {
          addToast("Preview unavailable for PDF generation.", "error");
          return;
        }

        const pdfBlob = await generatePdfBlob(previewElement, filename);
        pdfBase64 = await blobToBase64(pdfBlob);
      }

      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          invoiceNumber,
          clientName,
          amount,
          dueDate,
          senderName: effectiveSenderName,
          senderEmail: effectiveSenderEmail,
          shareUrl,
          pdfBase64,
          pdfFilename: `${filename}.pdf`,
          documentType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        addToast(data.error ?? "Failed to send email.", "error");
        return;
      }

      addToast(`Email sent to ${to.trim()}`, "success");
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send email.";
      addToast(errorMessage, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !sending && onClose()}
      title={modalTitle}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSend()} disabled={sending || !to.trim() || !subject.trim() || !message.trim()}>
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <FormField label="To" required>
          <input
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
            placeholder="client@example.com"
          />
        </FormField>

        <FormField label="CC">
          <input
            type="email"
            value={cc}
            onChange={(event) => setCc(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </FormField>

        <FormField label="Subject" required>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Message" required>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={textareaClass}
            rows={6}
          />
        </FormField>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={attachPdf}
              onChange={(event) => setAttachPdf(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Attach PDF to email
          </label>
          <p className="mt-1 text-xs text-slate-500">PDF will be generated from the current preview</p>
        </div>

        {sending && (
          <p className="text-xs text-slate-500">Generating PDF and sending...</p>
        )}
      </div>
    </Modal>
  );
}
