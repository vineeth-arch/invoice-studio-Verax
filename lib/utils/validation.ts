const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

export function isValidInvoiceNumber(num: string): boolean {
  if (!num || num.length > 16) return false;
  return /^[A-Za-z0-9\/\-]+$/.test(num);
}
