"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { inputClass } from "@/components/ui/FormField";
import { useSavedClients } from "@/lib/hooks/useSavedClients";
import { useToast } from "@/lib/hooks/useToast";
import type { SavedClient } from "@/lib/types/client";

const emptyClient = (): Omit<SavedClient, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  stateCode: "",
  pincode: "",
  gstin: "",
  email: "",
  phone: "",
  placeOfSupply: "",
  placeOfSupplyCode: "",
});

export default function ClientsPage() {
  const { clients, loading, saveClient, deleteClient } = useSavedClients();
  const { addToast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<SavedClient | null>(null);
  const [draft, setDraft] = useState(emptyClient());
  const [deleteTarget, setDeleteTarget] = useState<SavedClient | null>(null);
  const [saving, setSaving] = useState(false);

  const modalTitle = useMemo(() => editingClient ? "Edit client" : "Add new client", [editingClient]);

  const openNew = () => {
    setEditingClient(null);
    setDraft(emptyClient());
    setIsEditorOpen(true);
  };

  const openEdit = (client: SavedClient) => {
    setEditingClient(client);
    setDraft({
      name: client.name,
      address1: client.address1,
      address2: client.address2,
      city: client.city,
      state: client.state,
      stateCode: client.stateCode,
      pincode: client.pincode,
      gstin: client.gstin,
      email: client.email,
      phone: client.phone,
      placeOfSupply: client.placeOfSupply,
      placeOfSupplyCode: client.placeOfSupplyCode,
    });
    setIsEditorOpen(true);
  };

  const closeModal = () => {
    setEditingClient(null);
    setDraft(emptyClient());
    setIsEditorOpen(false);
  };

  const saveClientEntry = async () => {
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const result = await saveClient({
        id: editingClient?.id ?? uuidv4(),
        name: draft.name.trim(),
        address1: draft.address1.trim(),
        address2: draft.address2.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        stateCode: draft.stateCode.trim(),
        pincode: draft.pincode.trim(),
        gstin: draft.gstin.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        placeOfSupply: draft.placeOfSupply.trim(),
        placeOfSupplyCode: draft.placeOfSupplyCode.trim(),
        createdAt: editingClient?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      if (result.success) {
        addToast(editingClient ? "Client updated." : "Client added.", "success");
        closeModal();
      } else {
        addToast(result.error ?? "Failed to save client.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteClient(deleteTarget.id);
    if (result.success) {
      addToast("Client deleted.", "success");
      setDeleteTarget(null);
    } else {
      addToast(result.error ?? "Failed to delete client.", "error");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading clients...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Manage saved buyer addresses and GST details.</p>
        </div>
        <Button type="button" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add new client
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {clients.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">No saved clients yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-500">{client.gstin || "No GSTIN saved"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(client)}>
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(client)}>
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
            <Button type="button" onClick={saveClientEntry} loading={saving}>Save client</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Client name" value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
          <input className={inputClass} placeholder="GSTIN" value={draft.gstin} onChange={(e) => setDraft((prev) => ({ ...prev, gstin: e.target.value }))} />
          <input className={`${inputClass} col-span-2`} placeholder="Address line 1" value={draft.address1} onChange={(e) => setDraft((prev) => ({ ...prev, address1: e.target.value }))} />
          <input className={inputClass} placeholder="Address line 2" value={draft.address2} onChange={(e) => setDraft((prev) => ({ ...prev, address2: e.target.value }))} />
          <input className={inputClass} placeholder="City" value={draft.city} onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))} />
          <input className={inputClass} placeholder="State" value={draft.state} onChange={(e) => setDraft((prev) => ({ ...prev, state: e.target.value }))} />
          <input className={inputClass} placeholder="State code" value={draft.stateCode} onChange={(e) => setDraft((prev) => ({ ...prev, stateCode: e.target.value }))} />
          <input className={inputClass} placeholder="Pincode" value={draft.pincode} onChange={(e) => setDraft((prev) => ({ ...prev, pincode: e.target.value }))} />
          <input className={inputClass} placeholder="Email" value={draft.email} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
          <input className={inputClass} placeholder="Phone" value={draft.phone} onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Place of supply" value={draft.placeOfSupply} onChange={(e) => setDraft((prev) => ({ ...prev, placeOfSupply: e.target.value }))} />
          <input className={inputClass} placeholder="Place of supply code" value={draft.placeOfSupplyCode} onChange={(e) => setDraft((prev) => ({ ...prev, placeOfSupplyCode: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete client?"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        This client will be removed from your saved address book.
      </Modal>
    </div>
  );
}
