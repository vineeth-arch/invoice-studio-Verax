import type { Invoice } from "@/lib/types/invoice";
import type { PurchaseOrder } from "@/lib/types/purchase-order";

export function buildInvoiceDraftFromPurchaseOrder(po: PurchaseOrder): Partial<Invoice> {
  return {
    invoiceType: "TAX_INVOICE",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "DRAFT",
    paymentStatus: "Unpaid",
    baseClearedAmount: 0,
    baseClearedDate: "",
    gstCollectionMode: "standard",
    gstRecoveredAmount: 0,
    gstRecoveredDate: "",
    invoiceClearedDate: "",
    settlementNotes: "",
    poReference: po.poNumber,
    projectDescription: po.projectDescription,
    notes: po.commercialTerms?.notes,
    shareToken: undefined,
    buyer: {
      name: po.vendor.name,
      billingAddress: {
        ...po.vendor.address,
        country: po.vendor.address.country ?? "India",
      },
      gstin: po.vendor.gstin,
      contact: {
        email: po.vendor.contact?.email ?? "",
        phone: po.vendor.contact?.phone ?? "",
      },
      placeOfSupply: po.placeOfSupply ?? "",
      placeOfSupplyCode: po.placeOfSupplyCode ?? "",
    },
    lineItems: po.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      hsnSac: item.hsnSac ?? "",
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      discountPercent: item.discountPercent,
      gstRate: item.gstRate,
      gross: 0,
      discountAmount: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      lineTotal: 0,
    })),
  };
}

export function canConvertPurchaseOrder(po: PurchaseOrder | undefined): boolean {
  return Boolean(po && po.status === "FINAL" && po.poStatus === "Approved");
}
