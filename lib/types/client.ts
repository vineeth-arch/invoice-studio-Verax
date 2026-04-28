import type { Address, ContactInfo } from "./common";

export interface SavedClient {
  id: string;
  name: string;
  billingAddress: Address;
  gstin?: string;
  contact?: ContactInfo;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  lastUsedAt: string;
}
