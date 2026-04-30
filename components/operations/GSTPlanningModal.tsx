"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, textareaClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import type { GSTPlanningEntry } from "@/lib/types/settings";

interface GSTPlanningModalProps {
  month: string;
  open: boolean;
  entry?: GSTPlanningEntry;
  openingGstPayable?: number;
  gstAccruedThisMonth?: number;
  gstRecoveredFromClientsThisMonth?: number;
  onClose: () => void;
  onSave: (entry: GSTPlanningEntry) => Promise<void> | void;
}

export function GSTPlanningModal({
  month,
  open,
  entry,
  openingGstPayable = 0,
  gstAccruedThisMonth = 0,
  gstRecoveredFromClientsThisMonth = 0,
  onClose,
  onSave,
}: GSTPlanningModalProps) {
  const [gstPaidToGovernment, setGstPaidToGovernment] = useState("0");
  const [gstPaidDate, setGstPaidDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGstPaidToGovernment(String(entry?.gstPaidToGovernment ?? 0));
    setGstPaidDate(entry?.gstPaidDate ?? "");
    setNotes(entry?.notes ?? "");
  }, [entry, month]);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      month,
      gstPaidToGovernment: Number(gstPaidToGovernment) || 0,
      gstPaidDate,
      notes,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`GST Planning • ${month}`}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} loading={saving}>Save</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-slate-500">Opening payable</div>
              <div className="font-semibold text-slate-900">{openingGstPayable.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500">Accrued this month</div>
              <div className="font-semibold text-slate-900">{gstAccruedThisMonth.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500">Recovered from clients</div>
              <div className="font-semibold text-slate-900">{gstRecoveredFromClientsThisMonth.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="GST Paid To Government">
            <input
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={gstPaidToGovernment}
              onChange={(event) => setGstPaidToGovernment(event.target.value)}
            />
          </FormField>
          <FormField label="Paid Date">
            <input type="date" className={inputClass} value={gstPaidDate} onChange={(event) => setGstPaidDate(event.target.value)} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className={textareaClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
