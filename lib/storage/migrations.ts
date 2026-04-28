import { STORAGE_KEYS } from "./keys";

const CURRENT_VERSION = "1";

type RawRecord = Record<string, unknown>;

function parseArray(value: string | null): RawRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is RawRecord => typeof item === "object" && item !== null) : [];
  } catch {
    return [];
  }
}

function normalizeClientRecord(record: RawRecord): RawRecord {
  const billingAddress = (record.billingAddress as RawRecord | undefined) ?? {};
  const contact = (record.contact as RawRecord | undefined) ?? {};
  const timestamp =
    typeof record.updatedAt === "string"
      ? record.updatedAt
      : typeof record.createdAt === "string"
        ? record.createdAt
        : typeof record.lastUsedAt === "string"
          ? record.lastUsedAt
          : new Date().toISOString();

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    name: typeof record.name === "string" ? record.name : "",
    address1: typeof record.address1 === "string" ? record.address1 : typeof billingAddress.line1 === "string" ? billingAddress.line1 : "",
    address2: typeof record.address2 === "string" ? record.address2 : typeof billingAddress.line2 === "string" ? billingAddress.line2 : "",
    city: typeof record.city === "string" ? record.city : typeof billingAddress.city === "string" ? billingAddress.city : "",
    state: typeof record.state === "string" ? record.state : typeof billingAddress.state === "string" ? billingAddress.state : "",
    stateCode: typeof record.stateCode === "string" ? record.stateCode : typeof billingAddress.stateCode === "string" ? billingAddress.stateCode : "",
    pincode: typeof record.pincode === "string" ? record.pincode : typeof billingAddress.pincode === "string" ? billingAddress.pincode : "",
    gstin: typeof record.gstin === "string" ? record.gstin : "",
    email: typeof record.email === "string" ? record.email : typeof contact.email === "string" ? contact.email : "",
    phone: typeof record.phone === "string" ? record.phone : typeof contact.phone === "string" ? contact.phone : "",
    placeOfSupply: typeof record.placeOfSupply === "string" ? record.placeOfSupply : "",
    placeOfSupplyCode: typeof record.placeOfSupplyCode === "string" ? record.placeOfSupplyCode : "",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : timestamp,
    updatedAt: timestamp,
  };
}

function normalizeServiceRecord(record: RawRecord): RawRecord {
  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    description: typeof record.description === "string" ? record.description : "",
    sacCode: typeof record.sacCode === "string" ? record.sacCode : typeof record.hsnSac === "string" ? record.hsnSac : "",
    unit: typeof record.unit === "string" ? record.unit : "PCS",
    defaultRate: typeof record.defaultRate === "number" ? record.defaultRate : Number(record.defaultRate) || 0,
    defaultGstPercent: typeof record.defaultGstPercent === "number" ? record.defaultGstPercent : Number(record.defaultGstPercent) || 0,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
  };
}

export function runMigrations(): void {
  if (typeof window === "undefined") return;
  try {
    const version = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    if (!version) {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_VERSION);
    }

    const currentClients = parseArray(localStorage.getItem(STORAGE_KEYS.CLIENTS));
    const legacyClients = currentClients.length === 0
      ? parseArray(localStorage.getItem(STORAGE_KEYS.LEGACY_SAVED_CLIENTS))
      : [];
    const normalizedClients = [...currentClients, ...legacyClients].map(normalizeClientRecord);
    if (normalizedClients.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(normalizedClients));
    }

    const currentServices = parseArray(localStorage.getItem(STORAGE_KEYS.SERVICES));
    const normalizedServices = currentServices.map(normalizeServiceRecord);
    if (normalizedServices.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(normalizedServices));
    }
  } catch {
    // silently fail
  }
}
