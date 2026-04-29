"use client";

import { v4 as uuidv4 } from "uuid";
import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";
import type { BusinessProfile } from "@/lib/types/company";
import type { SavedClient } from "@/lib/types/client";
import type { SavedService } from "@/lib/types/service";
import type { DocumentTemplateSettings } from "@/lib/types/settings";
import { getDefaultCompanyProfile, mergeCompanyProfileWithDefaults } from "@/lib/defaults/companyProfile";
import { STORAGE_KEYS } from "./keys";
import { getFinancialYear } from "@/lib/utils/numbering";
import { resolveDocumentType, resolveInvoiceType } from "@/lib/utils/invoiceTypes";
import { withAutoOverdueStatus } from "@/lib/utils/aging";

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

function safeRemove(key: string): SaveResult {
  if (typeof window === "undefined") return { success: false, error: "Server-side" };
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove data." };
  }
}

function setMany(entries: Array<[string, unknown]>): SaveResult {
  for (const [key, value] of entries) {
    const result = safeSet(key, value);
    if (!result.success) return result;
  }
  return { success: true };
}

function removeMany(keys: string[]): SaveResult {
  for (const key of keys) {
    const result = safeRemove(key);
    if (!result.success) return result;
  }
  return { success: true };
}

// ─── Invoices ───────────────────────────────────────────

export function getInvoices(): Invoice[] {
  return safeGet<Invoice[]>(STORAGE_KEYS.INVOICES, []).map((invoice) =>
    withAutoOverdueStatus({
      ...invoice,
      documentType: resolveDocumentType(invoice),
      invoiceType: resolveInvoiceType(invoice),
    } as Invoice)
  );
}

export function getInvoice(id: string): Invoice | null {
  return getInvoices().find((inv) => inv.id === id) ?? null;
}

export function getInvoiceByShareToken(shareToken: string): Invoice | null {
  return getInvoices().find((invoice) => invoice.shareToken === shareToken) ?? null;
}

export function saveInvoice(invoice: Partial<Invoice> & { id?: string }): SaveResult & { id?: string } {
  const invoices = getInvoices();
  const now = new Date().toISOString();
  const existingIdx = invoice.id ? invoices.findIndex((i) => i.id === invoice.id) : -1;
  const normalizedInvoice = {
    ...invoice,
    documentType: resolveDocumentType(invoice),
    invoiceType: resolveInvoiceType(invoice),
  } as Partial<Invoice>;

  if (existingIdx >= 0) {
    invoices[existingIdx] = { ...invoices[existingIdx], ...normalizedInvoice, updatedAt: now } as Invoice;
  } else {
    const newInvoice = { ...normalizedInvoice, id: invoice.id || uuidv4(), createdAt: now, updatedAt: now } as Invoice;
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

export function getInvoiceConversionDraft(): Partial<Invoice> | null {
  return safeGet<Partial<Invoice> | null>("di_conversion_draft",
    safeGet<Partial<Invoice> | null>(STORAGE_KEYS.INVOICE_CONVERSION_DRAFT, null)
  );
}

export function saveInvoiceConversionDraft(invoice: Partial<Invoice>): SaveResult {
  return setMany([
    [STORAGE_KEYS.INVOICE_CONVERSION_DRAFT, invoice],
    ["di_conversion_draft", invoice],
  ]);
}

export function clearInvoiceConversionDraft(): SaveResult {
  return removeMany([STORAGE_KEYS.INVOICE_CONVERSION_DRAFT, "di_conversion_draft"]);
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
  const stored = safeGet<BusinessProfile | null>(
    "di_company_profile",
    safeGet<BusinessProfile | null>(STORAGE_KEYS.COMPANY_PROFILE, null)
  );
  const merged = mergeCompanyProfileWithDefaults(stored);

  if (!stored) {
    return merged;
  }

  if (JSON.stringify(stored) !== JSON.stringify(merged)) {
    safeSet(STORAGE_KEYS.COMPANY_PROFILE, merged);
  }

  return merged;
}

export function saveCompanyProfile(profile: BusinessProfile): SaveResult {
  const now = new Date().toISOString();
  const merged = mergeCompanyProfileWithDefaults({ ...profile, updatedAt: now });
  return setMany([
    [STORAGE_KEYS.COMPANY_PROFILE, merged],
    ["di_company_profile", merged],
  ]);
}

export function replaceCompanyProfile(profile: BusinessProfile | null): SaveResult {
  const nextProfile = profile ? mergeCompanyProfileWithDefaults(profile) : getDefaultCompanyProfile();
  return setMany([
    [STORAGE_KEYS.COMPANY_PROFILE, nextProfile],
    ["di_company_profile", nextProfile],
  ]);
}

// ─── Saved Clients ─────────────────────────────────────

function isNewSavedClient(client: SavedClient | LegacySavedClient): client is SavedClient {
  return "address1" in client;
}

type LegacySavedClient = {
  id: string;
  name: string;
  billingAddress: Invoice["buyer"]["billingAddress"];
  gstin?: string;
  contact?: Invoice["buyer"]["contact"];
  placeOfSupply: string;
  placeOfSupplyCode: string;
  lastUsedAt: string;
};

function migrateLegacyClient(client: LegacySavedClient): SavedClient {
  return {
    id: client.id,
    name: client.name,
    address1: client.billingAddress.line1,
    address2: client.billingAddress.line2 ?? "",
    city: client.billingAddress.city,
    state: client.billingAddress.state,
    stateCode: client.billingAddress.stateCode,
    pincode: client.billingAddress.pincode,
    gstin: client.gstin ?? "",
    email: client.contact?.email ?? "",
    phone: client.contact?.phone ?? "",
    placeOfSupply: client.placeOfSupply,
    placeOfSupplyCode: client.placeOfSupplyCode,
    createdAt: client.lastUsedAt,
    updatedAt: client.lastUsedAt,
  };
}

export function getSavedClients(): SavedClient[] {
  const current = safeGet<Array<SavedClient | LegacySavedClient>>(STORAGE_KEYS.CLIENTS, []);
  const legacy = current.length === 0
    ? safeGet<LegacySavedClient[]>(STORAGE_KEYS.LEGACY_SAVED_CLIENTS, [])
    : [];
  const clients = [...current, ...legacy]
    .map((client) => isNewSavedClient(client) ? client : migrateLegacyClient(client))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (clients.length > 0) {
    safeSet(STORAGE_KEYS.CLIENTS, clients);
  }

  return clients;
}

export function saveSavedClient(client: SavedClient): SaveResult {
  const clients = getSavedClients();
  const normalizedGstin = client.gstin.trim().toLowerCase();
  const existingIdx = normalizedGstin
    ? clients.findIndex((saved) => saved.gstin.trim().toLowerCase() === normalizedGstin)
    : clients.findIndex((saved) => saved.id === client.id);

  if (existingIdx >= 0) {
    clients[existingIdx] = { ...clients[existingIdx], ...client };
  } else {
    clients.push(client);
  }

  return safeSet(STORAGE_KEYS.CLIENTS, clients);
}

export function replaceSavedClients(clients: SavedClient[]): SaveResult {
  return safeSet(STORAGE_KEYS.CLIENTS, clients);
}

export function deleteSavedClient(id: string): SaveResult {
  return safeSet(STORAGE_KEYS.CLIENTS, getSavedClients().filter((client) => client.id !== id));
}

// ─── Saved Services ───────────────────────────────────

export function getSavedServices(): SavedService[] {
  return safeGet<SavedService[]>(STORAGE_KEYS.SERVICES, [])
    .sort((a, b) => a.description.localeCompare(b.description));
}

export function saveSavedService(service: SavedService): SaveResult {
  const services = getSavedServices();
  const existingIdx = services.findIndex((saved) => saved.id === service.id);

  if (existingIdx >= 0) {
    services[existingIdx] = { ...services[existingIdx], ...service };
  } else {
    services.push(service);
  }

  return safeSet(STORAGE_KEYS.SERVICES, services);
}

export function replaceSavedServices(services: SavedService[]): SaveResult {
  return safeSet(STORAGE_KEYS.SERVICES, services);
}

export function deleteSavedService(id: string): SaveResult {
  return safeSet(STORAGE_KEYS.SERVICES, getSavedServices().filter((service) => service.id !== id));
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
