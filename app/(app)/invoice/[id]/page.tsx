import { InvoiceDetailPage } from "@/components/invoice/InvoiceDetailPage";

interface Props {
  params: { id: string };
}

export default function InvoiceDetailRoute({ params }: Props) {
  return <InvoiceDetailPage invoiceId={params.id} />;
}
