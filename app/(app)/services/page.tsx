"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { inputClass } from "@/components/ui/FormField";
import { useServices } from "@/lib/hooks/useServices";
import { useToast } from "@/lib/hooks/useToast";
import type { SavedService } from "@/lib/types/service";

const emptyService = (): Omit<SavedService, "id" | "createdAt"> => ({
  description: "",
  sacCode: "",
  unit: "PCS",
  defaultRate: 0,
  defaultGstPercent: 18,
});

export default function ServicesPage() {
  const { services, loading, saveService, deleteService } = useServices();
  const { addToast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<SavedService | null>(null);
  const [draft, setDraft] = useState(emptyService());
  const [deleteTarget, setDeleteTarget] = useState<SavedService | null>(null);
  const [saving, setSaving] = useState(false);

  const modalTitle = useMemo(() => editingService ? "Edit service" : "Add new service", [editingService]);

  const openNew = () => {
    setEditingService(null);
    setDraft(emptyService());
    setIsEditorOpen(true);
  };

  const openEdit = (service: SavedService) => {
    setEditingService(service);
    setDraft({
      description: service.description,
      sacCode: service.sacCode,
      unit: service.unit,
      defaultRate: service.defaultRate,
      defaultGstPercent: service.defaultGstPercent,
    });
    setIsEditorOpen(true);
  };

  const closeModal = () => {
    setEditingService(null);
    setDraft(emptyService());
    setIsEditorOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const service: SavedService = {
        id: editingService?.id ?? uuidv4(),
        description: draft.description.trim(),
        sacCode: draft.sacCode.trim(),
        unit: draft.unit.trim() || "PCS",
        defaultRate: Number(draft.defaultRate) || 0,
        defaultGstPercent: Number(draft.defaultGstPercent) || 0,
        createdAt: editingService?.createdAt ?? new Date().toISOString(),
      };
      const result = await saveService(service);
      if (result.success) {
        addToast(editingService ? "Service updated." : "Service added.", "success");
        closeModal();
      } else {
        addToast(result.error ?? "Failed to save service.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteService(deleteTarget.id);
    if (result.success) {
      addToast("Service deleted.", "success");
      setDeleteTarget(null);
    } else {
      addToast(result.error ?? "Failed to delete service.", "error");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading services...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500">Manage reusable line item templates and SAC defaults.</p>
        </div>
        <Button type="button" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add new service
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {services.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">No saved services yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">{service.description}</div>
                  <div className="text-xs text-slate-500">SAC {service.sacCode || "N/A"} • ₹{service.defaultRate}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(service)}>
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(service)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={isEditorOpen}
        onClose={closeModal}
        title={modalTitle}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="button" onClick={handleSave} loading={saving}>Save service</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <input className={`${inputClass} col-span-2`} placeholder="Service description" value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
          <input className={inputClass} placeholder="SAC code" value={draft.sacCode} onChange={(e) => setDraft((prev) => ({ ...prev, sacCode: e.target.value }))} />
          <input className={inputClass} placeholder="Unit" value={draft.unit} onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))} />
          <input className={inputClass} type="number" min="0" step="any" placeholder="Default rate" value={draft.defaultRate} onChange={(e) => setDraft((prev) => ({ ...prev, defaultRate: Number(e.target.value) }))} />
          <input className={inputClass} type="number" min="0" step="any" placeholder="Default GST %" value={draft.defaultGstPercent} onChange={(e) => setDraft((prev) => ({ ...prev, defaultGstPercent: Number(e.target.value) }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete service?"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        This service template will be removed from the catalogue.
      </Modal>
    </div>
  );
}
