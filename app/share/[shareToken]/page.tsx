import { SharedInvoicePage } from "@/components/invoice/SharedInvoicePage";

interface ShareInvoiceRouteProps {
  params: {
    shareToken: string;
  };
}

export default function ShareInvoiceRoute({ params }: ShareInvoiceRouteProps) {
  const { shareToken } = params;
  return <SharedInvoicePage shareToken={shareToken} />;
}
