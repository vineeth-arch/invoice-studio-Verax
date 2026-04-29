"use client";

import type { PurchaseOrder } from "@/lib/types/purchase-order";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];

function sanitizePurchaseOrderForCloud(po: PurchaseOrder): PurchaseOrder {
  return {
    ...po,
    buyer: {
      ...po.buyer,
      logoImageBase64: undefined,
    },
    preparedBySignature: po.preparedBySignature
      ? { ...po.preparedBySignature, signatureImageBase64: undefined }
      : undefined,
    approvedBySignature: po.approvedBySignature
      ? { ...po.approvedBySignature, signatureImageBase64: undefined }
      : undefined,
    vendorAcceptanceSignature: po.vendorAcceptanceSignature
      ? { ...po.vendorAcceptanceSignature, signatureImageBase64: undefined }
      : undefined,
  };
}

function mergePurchaseOrderImages(cloudPO: PurchaseOrder, localPO?: PurchaseOrder | null): PurchaseOrder {
  if (!localPO) return cloudPO;

  return {
    ...cloudPO,
    shareToken: cloudPO.shareToken ?? localPO.shareToken,
    buyer: {
      ...cloudPO.buyer,
      logoImageBase64: cloudPO.buyer?.logoImageBase64 ?? localPO.buyer?.logoImageBase64,
    },
    preparedBySignature: cloudPO.preparedBySignature
      ? {
          ...cloudPO.preparedBySignature,
          signatureImageBase64: cloudPO.preparedBySignature.signatureImageBase64 ?? localPO.preparedBySignature?.signatureImageBase64,
        }
      : localPO.preparedBySignature,
    approvedBySignature: cloudPO.approvedBySignature
      ? {
          ...cloudPO.approvedBySignature,
          signatureImageBase64: cloudPO.approvedBySignature.signatureImageBase64 ?? localPO.approvedBySignature?.signatureImageBase64,
        }
      : localPO.approvedBySignature,
    vendorAcceptanceSignature: cloudPO.vendorAcceptanceSignature
      ? {
          ...cloudPO.vendorAcceptanceSignature,
          signatureImageBase64: cloudPO.vendorAcceptanceSignature.signatureImageBase64 ?? localPO.vendorAcceptanceSignature?.signatureImageBase64,
        }
      : localPO.vendorAcceptanceSignature,
  };
}

function toCloudPurchaseOrder(po: PurchaseOrder, userId: string): Database["public"]["Tables"]["purchase_orders"]["Insert"] {
  const sanitized = sanitizePurchaseOrderForCloud(po);
  return {
    id: sanitized.id,
    user_id: userId,
    po_number: sanitized.poNumber,
    status: sanitized.status,
    issue_date: sanitized.poDate || null,
    vendor: sanitized.vendor as unknown as Json,
    buyer: sanitized.buyer as unknown as Json,
    line_items: sanitized.lineItems as unknown as Json,
    totals: sanitized.totals as unknown as Json,
    notes: sanitized.commercialTerms?.notes ?? null,
    terms: sanitized.commercialTerms?.termsAndConditions ?? null,
    share_token: po.shareToken ?? null,
    signature_image_base64: po.approvedBySignature?.signatureImageBase64 ?? null,
    full_data: sanitized as unknown as Json,
    created_at: sanitized.createdAt,
    updated_at: sanitized.updatedAt,
  };
}

function fromCloudPurchaseOrder(row: PurchaseOrderRow, localPO?: PurchaseOrder | null): PurchaseOrder {
  const base = row.full_data as unknown as PurchaseOrder;
  return mergePurchaseOrderImages({
    ...base,
    id: row.id,
    shareToken: row.share_token ?? base.shareToken,
    approvedBySignature: base.approvedBySignature
      ? {
          ...base.approvedBySignature,
          signatureImageBase64: row.signature_image_base64 ?? base.approvedBySignature.signatureImageBase64,
        }
      : row.signature_image_base64
        ? { signatoryName: base.approvedBy ?? "", signatureImageBase64: row.signature_image_base64 }
        : base.approvedBySignature,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }, localPO);
}

export const purchaseOrdersRepository = {
  async list(): Promise<RepositoryResult<PurchaseOrder[]>> {
    const localPOs = local.getPurchaseOrders();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localPOs, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("purchase_orders")
        .select("*")
        .eq("user_id", cloud.userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const purchaseOrders = (data ?? []).map((row) => fromCloudPurchaseOrder(row, localPOs.find((po) => po.id === row.id)));
      local.replacePurchaseOrders(purchaseOrders);
      return { success: true, data: purchaseOrders, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localPOs,
        source: "local",
        error: toRepositoryError(error, "Unable to load purchase orders from cloud."),
      };
    }
  },

  async get(id: string): Promise<RepositoryResult<PurchaseOrder | null>> {
    const localPO = local.getPurchaseOrder(id);
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localPO, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("purchase_orders")
        .select("*")
        .eq("user_id", cloud.userId)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: true, data: localPO, source: "local" };
      }

      const purchaseOrder = fromCloudPurchaseOrder(data, localPO);
      return { success: true, data: purchaseOrder, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localPO,
        source: "local",
        error: toRepositoryError(error, "Unable to load purchase order from cloud."),
      };
    }
  },

  async getByShareToken(shareToken: string): Promise<RepositoryResult<PurchaseOrder | null>> {
    const localPO = local.getPurchaseOrderByShareToken(shareToken);
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: true, data: localPO, source: "local" };
    }

    try {
      const { data, error } = await client.rpc("get_po_by_share_token", {
        p_token: shareToken,
      });

      if (error) throw error;
      if (!data) {
        return { success: true, data: localPO, source: "local" };
      }

      const purchaseOrder = mergePurchaseOrderImages(data as unknown as PurchaseOrder, localPO);
      return { success: true, data: purchaseOrder, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localPO,
        source: "local",
        error: toRepositoryError(error, "Unable to load shared purchase order from cloud."),
      };
    }
  },

  async save(po: PurchaseOrder): Promise<RepositoryResult<{ id: string }>> {
    const localResult = local.savePurchaseOrder(po);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { id: localResult.id ?? po.id }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("purchase_orders").upsert(toCloudPurchaseOrder(po, cloud.userId));
      if (error) throw error;
      return { success: true, data: { id: localResult.id ?? po.id }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { id: localResult.id ?? po.id },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved purchase order locally, but cloud sync failed."),
      };
    }
  },

  async delete(id: string): Promise<RepositoryResult> {
    const localResult = local.deletePurchaseOrder(id);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("purchase_orders").delete().eq("user_id", cloud.userId).eq("id", id);
      if (error) throw error;
      return { success: true, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Deleted purchase order locally, but cloud delete failed."),
      };
    }
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    for (const po of local.getPurchaseOrders()) {
      const result = await this.save(po);
      if (!result.success) {
        return { success: false, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
      }
    }
    return { success: true, cloudSynced: true, source: "cloud" };
  },
};
