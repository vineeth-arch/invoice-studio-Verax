import { InvoiceEditorPage } from "@/components/invoice/InvoiceEditorPage";

export default function NewInvoicePage() {
  return <InvoiceEditorPage emailEnabled={Boolean(process.env.RESEND_API_KEY)} />;
}
