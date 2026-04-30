import { Resend } from "resend";

type SendInvoiceBody = {
  to?: string;
  cc?: string;
  subject?: string;
  message?: string;
  invoiceNumber?: string;
  clientName?: string;
  amount?: string;
  dueDate?: string;
  senderName?: string;
  senderEmail?: string;
  shareUrl?: string;
  pdfBase64?: string;
  pdfFilename?: string;
  documentType?: "invoice" | "po" | "proforma";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function normalizeBase64(value: string) {
  const parts = value.split(",");
  return parts.length > 1 ? parts.at(-1) ?? value : value;
}

function formatDocumentLabel(documentType: NonNullable<SendInvoiceBody["documentType"]>) {
  switch (documentType) {
    case "po":
      return "Purchase Order";
    case "proforma":
      return "Proforma Invoice";
    default:
      return "Invoice";
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: "Email not configured" }, { status: 503 });
    }

    const body = await request.json() as SendInvoiceBody;
    const {
      to,
      cc,
      subject,
      message,
      invoiceNumber,
      clientName,
      amount,
      dueDate,
      senderName,
      senderEmail,
      shareUrl,
      pdfBase64,
      pdfFilename,
      documentType,
    } = body;

    if (!to || !subject || !message || !invoiceNumber || !clientName || !amount || !senderName || !senderEmail || !documentType) {
      return Response.json({ error: "Missing required email fields." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailHtml = `
      <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
          <div style="border-top:4px solid #1a1a6e;padding:24px 28px 12px;background:#ffffff;">
            <div style="font-size:20px;font-weight:700;color:#1a1a6e;">${escapeHtml(senderName)}</div>
          </div>
          <div style="padding:8px 28px 28px;">
            <div style="font-size:15px;line-height:1.7;color:#374151;margin-bottom:20px;">
              ${nl2br(message.trim())}
            </div>
            <div style="background:#f3f4f6;border:1px solid #e5e7eb;padding:16px 18px;margin-bottom:24px;">
              <div style="font-size:14px;line-height:1.8;"><strong>${escapeHtml(formatDocumentLabel(documentType))} No:</strong> ${escapeHtml(invoiceNumber)}</div>
              <div style="font-size:14px;line-height:1.8;"><strong>Client:</strong> ${escapeHtml(clientName)}</div>
              <div style="font-size:14px;line-height:1.8;"><strong>Amount:</strong> ₹${escapeHtml(amount)}</div>
              ${dueDate ? `<div style="font-size:14px;line-height:1.8;"><strong>Due Date:</strong> ${escapeHtml(dueDate)}</div>` : ""}
            </div>
            ${shareUrl ? `
              <div style="margin-bottom:24px;">
                <a
                  href="${escapeHtml(shareUrl)}"
                  style="display:inline-block;background:#1a1a6e;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600;"
                >
                  View Invoice Online
                </a>
              </div>
            ` : ""}
            <div style="font-size:12px;color:#9ca3af;">
              Sent via GST Invoice Studio by Design Innsaeit
            </div>
          </div>
        </div>
      </div>
    `;

    const attachments = pdfBase64
      ? [{
          filename: pdfFilename ?? `${invoiceNumber}.pdf`,
          content: normalizeBase64(pdfBase64),
        }]
      : undefined;

    const { error } = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`,
      to: [to],
      cc: cc ? [cc] : undefined,
      subject,
      html: emailHtml,
      attachments,
    });

    if (error) {
      return Response.json({ error: error.message || "Failed to send email." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[send-invoice] unexpected error", error);
    const message = error instanceof Error ? error.message : "Unexpected error while sending email.";
    return Response.json({ error: message }, { status: 500 });
  }
}
