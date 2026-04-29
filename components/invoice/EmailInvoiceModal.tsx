"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import type { EmailSettings } from "@/lib/types/email";

interface EmailInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: { to: string; cc: string; subject: string; message: string }) => Promise<void>;
  invoiceNumber: string;
  amountLabel: string;
  companyName: string;
  clientName: string;
  defaultRecipient: string;
  emailSettings: EmailSettings;
}

export function EmailInvoiceModal({
  open,
  onClose,
  onSend,
  invoiceNumber,
  amountLabel,
  companyName,
  clientName,
  defaultRecipient,
  emailSettings,
}: EmailInvoiceModalProps) {
  const defaultSubject = useMemo(
    () => `Invoice ${invoiceNumber} from ${companyName} — ${amountLabel}`,
    [amountLabel, companyName, invoiceNumber]
  );

  const defaultMessage = useMemo(() => {
    const intro = [
      `Dear ${clientName || "Client"},`,
      "",
      `Please find invoice ${invoiceNumber} from ${companyName} for ${amountLabel}.`,
      "You can view the invoice online using the secure link in this email, and the PDF is attached for your records.",
      "",
      "Please let us know if you need anything further.",
    ];

    if (emailSettings.signature.trim()) {
      intro.push("", emailSettings.signature.trim());
    }

    return intro.join("\n");
  }, [amountLabel, clientName, companyName, emailSettings.signature, invoiceNumber]);

  const [to, setTo] = useState(defaultRecipient);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(defaultRecipient);
    setCc("");
    setSubject(defaultSubject);
    setMessage(defaultMessage);
  }, [defaultMessage, defaultRecipient, defaultSubject, open]);

  const senderConfigured = Boolean(emailSettings.fromEmail.trim());

  const handleSubmit = async () => {
    setSending(true);
    try {
      await onSend({ to, cc, subject, message });
      onClose();
    } catch {
      // Toast handling lives in the caller so the modal can stay open for correction.
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !sending && onClose()}
      title="Email Invoice"
      actions={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} loading={sending} disabled={!to.trim() || !subject.trim() || !senderConfigured}>
            Send Invoice
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        {!senderConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Add a verified From Email in Settings before sending invoices.
          </div>
        )}
        <FormField label="To">
          <input type="email" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
        </FormField>
        <FormField label="CC">
          <input type="text" value={cc} onChange={(event) => setCc(event.target.value)} className={inputClass} placeholder="Optional, comma-separated" />
        </FormField>
        <FormField label="Subject">
          <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Message">
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} className={textareaClass} rows={8} />
        </FormField>
      </div>
    </Modal>
  );
}
