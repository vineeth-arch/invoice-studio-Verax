import { POEditorPage } from "@/components/purchase-order/POEditorPage";

interface Props {
  params: { id: string };
}

export default function EditPOPage({ params }: Props) {
  return <POEditorPage poId={params.id} />;
}
