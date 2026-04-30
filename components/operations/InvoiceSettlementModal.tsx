"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/lib/hooks/useToast";
import type { Invoice } from "@/lib/types/invoice";
import {
  getBaseExpectedAmount,
  getBasePendingAmount,
  getGstPendingFromClient,
  getInvoiceGstAmount,
  normalizeInvoiceSettlement,
} from "@/lib/utils/invoiceClearance";

interface InvoiceSettlementModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => Promise<{ success: boolean; error?: string }>;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

export function InvoiceSettlementModal({ invoice, open, onClose, onSave }: InvoiceSettlementModalProps) {
  const { addToast } = useToast();
  const [baseClearedAmount, setBaseClearedAmount] = useState("0");
  const [baseClearedDate, setBaseClearedDate] = useState("");
  const [gstCollectionMode, setGstCollectionMode] = useState<Invoice["gstCollectionMode"]>("standard");
  const [gstRecoveredAmount, setGstRecoveredAmount] = useState("0");
  const [gstRecoveredDate, setGstRecoveredDate] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const normalizedInvoice = useMemo(() => (invoice ? normalizeInvoiceSettlement(invoice) : null), [invoice]);

  useEffect(() => {
    if (!normalizedInvoice) return;
    setBaseClearedAmount(String(normalizedInvoice.baseClearedAmount ?? 0));
    setBaseClearedDate(normalizedInvoice.baseClearedDate ?? "");
    setGstCollectionMode(normalizedInvoice.gstCollectionMode);
    setGstRecoveredAmount(String(normalizedInvoice.gstRecoveredAmount ?? 0));
    setGstRecoveredDate(normalizedInvoice.gstRecoveredDate ?? "");
    setSettlementNotes(normalizedInvoice.settlementNotes ?? "");
  }, [normalizedInvoice]);

  const snapshot = useMemo(() => {
    if (!normalizedInvoice) return null;
    const normalizedGstAmount = getInvoiceGstAmount(normalizedInvoice);
    const effectiveGstRecoveredAmount = gstCollectionMode === "standard"
      ? normalizedGstAmount
      : Number(gstRecoveredAmount) || 0;
    const draft = normalizeInvoiceSettlement({
      ...normalizedInvoice,
      baseClearedAmount: Number(baseClearedAmount) || 0,
      baseClearedDate,
      gstCollectionMode,
      gstRecoveredAmount: effectiveGstRecoveredAmount,
      gstRecoveredDate: gstCollectionMode === "standard" ? (gstRecoveredDate || baseClearedDate) : gstRecoveredDate,
      settlementNotes,
    });
    return {
      draft,
      baseExpected: getBaseExpectedAmount(draft),
      basePending: getBasePendingAmount(draft),
      gstAmount: normalizedGstAmount,
      gstPending: getGstPendingFromClient(draft),
    };
  }, [baseClearedAmount, baseClearedDate, gstCollectionMode, gstRecoveredAmount, gstRecoveredDate, normalizedInvoice, settlementNotes]);

  const handleSubmit = async () => {
    if (!snapshot) return;
    setSaving(true);
    const result = await onSave(snapshot.draft as Invoice);
    setSaving(false);
    if (result.success) {
      addToast("Settlement updated.", "success");
      onClose();
      return;
    }
    addToast(result.error ?? "Failed to update settlement.", "error");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={normalizedInvoice ? `Update Settlement • ${normalizedInvoice.invoiceNumber}` : "Update Settlement"}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} loading={saving}>Save</Button>
        </>
      )}
    >
      {!snapshot || !normalizedInvoice ? null : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{normalizedInvoice.buyer.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-500">Base expected</div>
                <div className="font-semibold text-slate-900">{snapshot.baseExpected.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-slate-500">GST amount</div>
                <div className="font-semibold text-slate-900">{snapshot.gstAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-slate-500">Base pending</div>
                <div className="font-semibold text-slate-900">{snapshot.basePending.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-slate-500">GST pending</div>
                <div className="font-semibold text-slate-900">{snapshot.gstPending.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Base Cleared Amount">
              <input
                type="number"
                min="0"
                step="any"
                className={inputClass}
                value={baseClearedAmount}
                onChange={(event) => setBaseClearedAmount(String(round2(Number(event.target.value) || 0)))}
              />
            </FormField>
            <FormField label="Base Cleared Date">
              <input type="date" className={inputClass} value={baseClearedDate} onChange={(event) => setBaseClearedDate(event.target.value)} />
            </FormField>
            <FormField label="GST Recovery Mode">
              <select className={inputClass} value={gstCollectionMode} onChange={(event) => setGstCollectionMode(event.target.value as Invoice["gstCollectionMode"])}>
                <option value="standard">Standard</option>
                <option value="deferred">Deferred</option>
              </select>
            </FormField>
            <FormField label="GST Recovered Amount">
              <input
                type="number"
                min="0"
                max={snapshot.gstAmount}
                step="any"
                className={inputClass}
                value={gstCollectionMode === "standard" ? snapshot.gstAmount.toFixed(2) : gstRecoveredAmount}
                onChange={(event) => setGstRecoveredAmount(String(round2(Number(event.target.value) || 0)))}
                readOnly={gstCollectionMode === "standard"}
              />
            </FormField>
            <FormField label="GST Recovered Date">
              <input type="date" className={inputClass} value={gstRecoveredDate} onChange={(event) => setGstRecoveredDate(event.target.value)} />
            </FormField>
          </div>

          <FormField label="Settlement Notes">
            <textarea className={textareaClass} value={settlementNotes} onChange={(event) => setSettlementNotes(event.target.value)} />
          </FormField>
        </div>
      )}
    </Modal>
  );
}
