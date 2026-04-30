"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/lib/hooks/useToast";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

interface POStatusModalProps {
  purchaseOrder: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
  onSave: (purchaseOrder: PurchaseOrder) => Promise<{ success: boolean; error?: string }>;
}

export function POStatusModal({ purchaseOrder, open, onClose, onSave }: POStatusModalProps) {
  const { addToast } = useToast();
  const [poStatus, setPoStatus] = useState<PurchaseOrder["poStatus"]>("Under Approval");
  const [poStatusDate, setPoStatusDate] = useState("");
  const [poStatusNote, setPoStatusNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!purchaseOrder) return;
    setPoStatus(purchaseOrder.poStatus);
    setPoStatusDate(purchaseOrder.poStatusDate ?? "");
    setPoStatusNote(purchaseOrder.poStatusNote ?? "");
  }, [purchaseOrder]);

  const handleSubmit = async () => {
    if (!purchaseOrder) return;
    setSaving(true);
    const result = await onSave({
      ...purchaseOrder,
      poStatus,
      poStatusDate: poStatusDate || new Date().toISOString().slice(0, 10),
      poStatusNote,
    });
    setSaving(false);
    if (result.success) {
      addToast("PO status updated.", "success");
      onClose();
      return;
    }
    addToast(result.error ?? "Failed to update PO status.", "error");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchaseOrder ? `Update PO Status • ${purchaseOrder.poNumber}` : "Update PO Status"}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} loading={saving}>Save</Button>
        </>
      )}
    >
      {!purchaseOrder ? null : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{purchaseOrder.vendor.name}</p>
            <p className="mt-1 text-xs text-slate-500">Update approval or processing status without opening the full PO form.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="PO Status">
              <select className={inputClass} value={poStatus} onChange={(event) => setPoStatus(event.target.value as PurchaseOrder["poStatus"])}>
                <option value="Under Approval">Under Approval</option>
                <option value="Approved">Approved</option>
                <option value="Processed">Processed</option>
              </select>
            </FormField>
            <FormField label="Status Date">
              <input type="date" className={inputClass} value={poStatusDate} onChange={(event) => setPoStatusDate(event.target.value)} />
            </FormField>
          </div>
          <FormField label="Internal Note">
            <textarea className={textareaClass} value={poStatusNote} onChange={(event) => setPoStatusNote(event.target.value)} />
          </FormField>
        </div>
      )}
    </Modal>
  );
}
