import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
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
    } = body;

    if (!to || !subject || !invoiceNumber || !senderName || !senderEmail || !shareUrl || !pdfBase64) {
      return NextResponse.json({ error: "Missing required email fields." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const ccList = (cc ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const html = `
      <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Invoice Delivery</div>
          <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;">${escapeHtml(senderName)}</h1>
          <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">${nl2br(message?.trim() || `Please find invoice ${invoiceNumber} attached for ${clientName || "your records"}.`)}</p>
          <div style="border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;background:#f8fafc;margin-bottom:24px;">
            <div style="font-size:14px;line-height:1.8;"><strong>Invoice Number:</strong> ${escapeHtml(invoiceNumber)}</div>
            <div style="font-size:14px;line-height:1.8;"><strong>Recipient:</strong> ${escapeHtml(clientName || "-")}</div>
            <div style="font-size:14px;line-height:1.8;"><strong>Amount:</strong> ${escapeHtml(amount || "-")}</div>
            <div style="font-size:14px;line-height:1.8;"><strong>Due Date:</strong> ${escapeHtml(dueDate || "-")}</div>
          </div>
          <a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">View Invoice</a>
          <p style="font-size:13px;color:#64748b;margin:20px 0 0;">PDF attached below.</p>
          <p style="font-size:12px;color:#94a3b8;margin:28px 0 0;">Sent via Invoice Studio</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to,
      cc: ccList.length > 0 ? ccList : undefined,
      subject,
      html,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: normalizeBase64(pdfBase64),
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to send email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-invoice] unexpected error", error);
    return NextResponse.json({ error: "Unexpected error while sending email." }, { status: 500 });
  }
}
