"use client";

import type { Invoice } from "@/lib/types/invoice";
import type { Database, Json } from "@/lib/supabase/types";
import * as local from "@/lib/storage/local";
import { getCloudContext, toRepositoryError, type RepositoryResult } from "./_shared";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

function sanitizeInvoiceForCloud(invoice: Invoice): Invoice {
  return {
    ...invoice,
    irnQrImageBase64: undefined,
    supplier: {
      ...invoice.supplier,
      logoImageBase64: undefined,
    },
    paymentDetails: invoice.paymentDetails
      ? {
          ...invoice.paymentDetails,
          upiQrImageBase64: undefined,
        }
      : undefined,
    signature: {
      ...invoice.signature,
      signatureImageBase64: undefined,
    },
  };
}

function mergeInvoiceImages(cloudInvoice: Invoice, localInvoice?: Invoice | null): Invoice {
  if (!localInvoice) return cloudInvoice;

  return {
    ...cloudInvoice,
    supplier: {
      ...cloudInvoice.supplier,
      logoImageBase64: localInvoice.supplier?.logoImageBase64,
    },
    irnQrImageBase64: localInvoice.irnQrImageBase64,
    paymentDetails: cloudInvoice.paymentDetails
      ? {
          ...cloudInvoice.paymentDetails,
          upiQrImageBase64: localInvoice.paymentDetails?.upiQrImageBase64,
        }
      : localInvoice.paymentDetails,
    signature: {
      ...cloudInvoice.signature,
      signatureImageBase64: localInvoice.signature?.signatureImageBase64,
    },
  };
}

function toCloudInvoice(invoice: Invoice, userId: string): Database["public"]["Tables"]["invoices"]["Insert"] {
  const sanitized = sanitizeInvoiceForCloud(invoice);
  return {
    id: sanitized.id,
    user_id: userId,
    invoice_number: sanitized.invoiceNumber,
    status: sanitized.status,
    issue_date: sanitized.invoiceDate || null,
    due_date: sanitized.dueDate || null,
    buyer: sanitized.buyer as unknown as Json,
    seller: sanitized.supplier as unknown as Json,
    line_items: sanitized.lineItems as unknown as Json,
    totals: sanitized.totals as unknown as Json,
    notes: sanitized.notes ?? null,
    terms: sanitized.termsAndConditions ?? null,
    full_data: sanitized as unknown as Json,
    created_at: sanitized.createdAt,
    updated_at: sanitized.updatedAt,
  };
}

function fromCloudInvoice(row: InvoiceRow, localInvoice?: Invoice | null): Invoice {
  const base = row.full_data as unknown as Invoice;
  return mergeInvoiceImages({ ...base, id: row.id, updatedAt: row.updated_at, createdAt: row.created_at }, localInvoice);
}

export const invoicesRepository = {
  async list(): Promise<RepositoryResult<Invoice[]>> {
    const localInvoices = local.getInvoices();
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localInvoices, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("invoices")
        .select("*")
        .eq("user_id", cloud.userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const invoices = (data ?? []).map((row) => fromCloudInvoice(row, localInvoices.find((invoice) => invoice.id === row.id)));
      local.replaceInvoices(invoices);
      return { success: true, data: invoices, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localInvoices,
        source: "local",
        error: toRepositoryError(error, "Unable to load invoices from cloud."),
      };
    }
  },

  async get(id: string): Promise<RepositoryResult<Invoice | null>> {
    const localInvoice = local.getInvoice(id);
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localInvoice, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("invoices")
        .select("*")
        .eq("user_id", cloud.userId)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: true, data: localInvoice, source: "local" };
      }

      const invoice = fromCloudInvoice(data, localInvoice);
      return { success: true, data: invoice, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localInvoice,
        source: "local",
        error: toRepositoryError(error, "Unable to load invoice from cloud."),
      };
    }
  },

  async getByShareToken(shareToken: string): Promise<RepositoryResult<Invoice | null>> {
    const localInvoice = local.getInvoiceByShareToken(shareToken);
    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: localInvoice, source: "local" };
    }

    try {
      const { data, error } = await cloud.client
        .from("invoices")
        .select("*")
        .eq("user_id", cloud.userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const invoiceRow = (data ?? []).find((row) => {
        const fullData = row.full_data as unknown as Partial<Invoice> | null;
        return fullData?.shareToken === shareToken;
      });

      if (!invoiceRow) {
        return { success: true, data: localInvoice, source: "local" };
      }

      const invoice = fromCloudInvoice(invoiceRow, local.getInvoice(invoiceRow.id));
      return { success: true, data: invoice, source: "cloud" };
    } catch (error) {
      return {
        success: true,
        data: localInvoice,
        source: "local",
        error: toRepositoryError(error, "Unable to load shared invoice from cloud."),
      };
    }
  },

  async save(invoice: Invoice): Promise<RepositoryResult<{ id: string }>> {
    const localResult = local.saveInvoice(invoice);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, data: { id: localResult.id ?? invoice.id }, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("invoices").upsert(toCloudInvoice(invoice, cloud.userId));
      if (error) throw error;
      return { success: true, data: { id: localResult.id ?? invoice.id }, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        data: { id: localResult.id ?? invoice.id },
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Saved invoice locally, but cloud sync failed."),
      };
    }
  },

  async delete(id: string): Promise<RepositoryResult> {
    const localResult = local.deleteInvoice(id);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }

    const cloud = await getCloudContext();
    if (!cloud) {
      return { success: true, source: "local", cloudSynced: false };
    }

    try {
      const { error } = await cloud.client.from("invoices").delete().eq("user_id", cloud.userId).eq("id", id);
      if (error) throw error;
      return { success: true, source: "cloud", cloudSynced: true };
    } catch (error) {
      return {
        success: true,
        source: "local",
        cloudSynced: false,
        error: toRepositoryError(error, "Deleted invoice locally, but cloud delete failed."),
      };
    }
  },

  async syncLocalToCloud(): Promise<RepositoryResult> {
    for (const invoice of local.getInvoices()) {
      const result = await this.save(invoice);
      if (!result.success) {
        return { success: false, error: result.error, cloudSynced: result.cloudSynced, source: result.source };
      }
    }
    return { success: true, cloudSynced: true, source: "cloud" };
  },
};
