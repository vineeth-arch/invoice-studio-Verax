import { InvoiceEditorPage } from "@/components/invoice/InvoiceEditorPage";

interface Props {
  params: { id: string };
}

export default function EditInvoicePage({ params }: Props) {
  return <InvoiceEditorPage invoiceId={params.id} emailEnabled={Boolean(process.env.RESEND_API_KEY)} />;
}
