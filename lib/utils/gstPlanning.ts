import type { GSTPlanningEntry } from "@/lib/types/settings";

function round2(value: number) {
  return Number(value.toFixed(2));
}

export function normalizeGSTPlanningEntries(entries: GSTPlanningEntry[] | undefined) {
  return (entries ?? [])
    .filter((entry) => entry.month)
    .map((entry) => ({
      month: entry.month,
      gstPaidToGovernment: round2(Number(entry.gstPaidToGovernment) || 0),
      gstPaidDate: entry.gstPaidDate ?? "",
      notes: entry.notes ?? "",
      updatedAt: entry.updatedAt,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export function getGSTPlanningEntry(entries: GSTPlanningEntry[] | undefined, month: string) {
  return normalizeGSTPlanningEntries(entries).find((entry) => entry.month === month);
}

export function upsertGSTPlanningEntry(
  entries: GSTPlanningEntry[] | undefined,
  entry: GSTPlanningEntry,
) {
  const normalizedEntries = normalizeGSTPlanningEntries(entries);
  const next = normalizedEntries.filter((item) => item.month !== entry.month);
  next.push({
    month: entry.month,
    gstPaidToGovernment: round2(Number(entry.gstPaidToGovernment) || 0),
    gstPaidDate: entry.gstPaidDate ?? "",
    notes: entry.notes ?? "",
    updatedAt: entry.updatedAt,
  });
  return next.sort((a, b) => b.month.localeCompare(a.month));
}
