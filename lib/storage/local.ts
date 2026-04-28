"use client";

import { v4 as uuidv4 } from "uuid";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { BusinessProfile } from "@/lib/types/company";
import type { SavedClient } from "@/lib/types/client";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import { getDefaultCompanyProfile, mergeCompanyProfileWithDefaults } from "@/lib/defaults/companyProfile";
import { STORAGE_KEYS } from "./keys";
import { getFinancialYear } from "@/lib/utils/numbering";

type SaveResult = { success: boolean; error?: string };

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): SaveResult {
  if (typeof window === "undefined") return { success: false, error: "Server-side" };
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return { success: false, error: "Storage is full. Please delete old documents or reduce image sizes." };
    }
    return { success: false, error: "Failed to save data." };
  }
}

// ─── Invoices ───────────────────────────────────────────

export function getInvoices(): Invoice[] {
  return safeGet<Invoice[]>(STORAGE_KEYS.INVOICES, []);
}

export function getInvoice(id: string): Invoice | null {
  return getInvoices().find((inv) => inv.id === id) ?? null;
}

export function saveInvoice(invoice: Partial<Invoice> & { id?: string }): SaveResult & { id?: string } {
  const invoices = getInvoices();
  const now = new Date().toISOString();
  const existingIdx = invoice.id ? invoices.findIndex((i) => i.id === invoice.id) : -1;

  if (existingIdx >= 0) {
    invoices[existingIdx] = { ...invoices[existingIdx], ...invoice, updatedAt: now } as Invoice;
  } else {
    const newInvoice = { ...invoice, id: invoice.id || uuidv4(), createdAt: now, updatedAt: now } as Invoice;
    invoices.push(newInvoice);
    const result = safeSet(STORAGE_KEYS.INVOICES, invoices);
    return { ...result, id: newInvoice.id };
  }

  const result = safeSet(STORAGE_KEYS.INVOICES, invoices);
  return { ...result, id: invoices[existingIdx]?.id };
}

export function deleteInvoice(id: string): SaveResult {
  const invoices = getInvoices().filter((i) => i.id !== id);
  return safeSet(STORAGE_KEYS.INVOICES, invoices);
}

export function replaceInvoices(invoices: Invoice[]): SaveResult {
  return safeSet(STORAGE_KEYS.INVOICES, invoices);
}

// ─── Purchase Orders ────────────────────────────────────

export function getPurchaseOrders(): PurchaseOrder[] {
  return safeGet<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
}

export function getPurchaseOrder(id: string): PurchaseOrder | null {
  return getPurchaseOrders().find((po) => po.id === id) ?? null;
}

export function savePurchaseOrder(po: Partial<PurchaseOrder> & { id?: string }): SaveResult & { id?: string } {
  const orders = getPurchaseOrders();
  const now = new Date().toISOString();
  const existingIdx = po.id ? orders.findIndex((o) => o.id === po.id) : -1;

  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...po, updatedAt: now } as PurchaseOrder;
  } else {
    const newPO = { ...po, id: po.id || uuidv4(), createdAt: now, updatedAt: now } as PurchaseOrder;
    orders.push(newPO);
    const result = safeSet(STORAGE_KEYS.PURCHASE_ORDERS, orders);
    return { ...result, id: newPO.id };
  }

  const result = safeSet(STORAGE_KEYS.PURCHASE_ORDERS, orders);
  return { ...result, id: orders[existingIdx]?.id };
}

export function deletePurchaseOrder(id: string): SaveResult {
  const orders = getPurchaseOrders().filter((o) => o.id !== id);
  return safeSet(STORAGE_KEYS.PURCHASE_ORDERS, orders);
}

export function replacePurchaseOrders(purchaseOrders: PurchaseOrder[]): SaveResult {
  return safeSet(STORAGE_KEYS.PURCHASE_ORDERS, purchaseOrders);
}

// ─── Company Profile ────────────────────────────────────

export function getCompanyProfile(): BusinessProfile | null {
  const stored = safeGet<BusinessProfile | null>(STORAGE_KEYS.COMPANY_PROFILE, null);
  const merged = mergeCompanyProfileWithDefaults(stored);

  if (!stored) {
    safeSet(STORAGE_KEYS.COMPANY_PROFILE, merged);
    return merged;
  }

  if (JSON.stringify(stored) !== JSON.stringify(merged)) {
    safeSet(STORAGE_KEYS.COMPANY_PROFILE, merged);
  }

  return merged;
}

export function saveCompanyProfile(profile: BusinessProfile): SaveResult {
  const now = new Date().toISOString();
  return safeSet(STORAGE_KEYS.COMPANY_PROFILE, mergeCompanyProfileWithDefaults({ ...profile, updatedAt: now }));
}

export function replaceCompanyProfile(profile: BusinessProfile | null): SaveResult {
  return safeSet(STORAGE_KEYS.COMPANY_PROFILE, profile ? mergeCompanyProfileWithDefaults(profile) : getDefaultCompanyProfile());
}

// ─── Saved Clients ─────────────────────────────────────

export function getSavedClients(): SavedClient[] {
  return safeGet<SavedClient[]>(STORAGE_KEYS.SAVED_CLIENTS, [])
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
}

export function saveSavedClient(client: SavedClient): SaveResult {
  const clients = getSavedClients();
  const normalizedName = client.name.trim().toLowerCase();
  const normalizedGstin = (client.gstin ?? "").trim().toLowerCase();
  const existingIdx = clients.findIndex((saved) =>
    saved.name.trim().toLowerCase() === normalizedName &&
    (saved.gstin ?? "").trim().toLowerCase() === normalizedGstin
  );

  if (existingIdx >= 0) {
    clients[existingIdx] = { ...clients[existingIdx], ...client, lastUsedAt: new Date().toISOString() };
  } else {
    clients.push({ ...client, lastUsedAt: new Date().toISOString() });
  }

  return safeSet(STORAGE_KEYS.SAVED_CLIENTS, clients);
}

export function saveBuyerAsClient(buyer: Invoice["buyer"] | undefined | null): SaveResult {
  if (!buyer?.name?.trim() || !buyer.billingAddress?.line1?.trim()) {
    return { success: true };
  }

  return saveSavedClient({
    id: uuidv4(),
    name: buyer.name,
    billingAddress: buyer.billingAddress,
    gstin: buyer.gstin,
    contact: buyer.contact,
    placeOfSupply: buyer.placeOfSupply,
    placeOfSupplyCode: buyer.placeOfSupplyCode,
    lastUsedAt: new Date().toISOString(),
  });
}

export function replaceSavedClients(clients: SavedClient[]): SaveResult {
  return safeSet(STORAGE_KEYS.SAVED_CLIENTS, clients);
}

// ─── Settings ───────────────────────────────────────────

const DEFAULT_SETTINGS: DocumentTemplateSettings = {
  invoiceNumbering: { prefix: "INV", separator: "-", includeYear: true, paddingLength: 4, currentSequence: 1 },
  poNumbering: { prefix: "PO", separator: "-", includeYear: true, paddingLength: 4, currentSequence: 1 },
  defaultGSTMode: "CGST_SGST",
  defaultCurrency: "INR",
  dateFormat: "DD MMM YYYY",
  showLogo: true,
  showSignature: true,
  showBankDetails: true,
  showQRCode: true,
  storedFinancialYear: getFinancialYear(),
  updatedAt: new Date().toISOString(),
};

export function getSettings(): DocumentTemplateSettings {
  const stored = safeGet<DocumentTemplateSettings | null>(STORAGE_KEYS.SETTINGS, null);
  if (!stored) return DEFAULT_SETTINGS;
  // FY rollover: if stored FY != current FY, reset sequences
  const currentFY = getFinancialYear();
  if (stored.storedFinancialYear && stored.storedFinancialYear !== currentFY) {
    const reset = {
      ...stored,
      invoiceNumbering: { ...stored.invoiceNumbering, currentSequence: 1 },
      poNumbering: { ...stored.poNumbering, currentSequence: 1 },
      storedFinancialYear: currentFY,
    };
    safeSet(STORAGE_KEYS.SETTINGS, reset);
    return reset;
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: DocumentTemplateSettings): SaveResult {
  const now = new Date().toISOString();
  return safeSet(STORAGE_KEYS.SETTINGS, { ...settings, updatedAt: now });
}

export function replaceSettings(settings: DocumentTemplateSettings): SaveResult {
  return safeSet(STORAGE_KEYS.SETTINGS, settings);
}

export function incrementInvoiceSequence(): void {
  const settings = getSettings();
  saveSettings({
    ...settings,
    invoiceNumbering: {
      ...settings.invoiceNumbering,
      currentSequence: settings.invoiceNumbering.currentSequence + 1,
    },
  });
}

export function incrementPOSequence(): void {
  const settings = getSettings();
  saveSettings({
    ...settings,
    poNumbering: {
      ...settings.poNumbering,
      currentSequence: settings.poNumbering.currentSequence + 1,
    },
  });
}
