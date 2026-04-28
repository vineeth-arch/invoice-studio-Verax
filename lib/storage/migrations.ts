import { STORAGE_KEYS } from "./keys";

const CURRENT_VERSION = "1";

export function runMigrations(): void {
  if (typeof window === "undefined") return;
  try {
    const version = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    if (!version) {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_VERSION);
    }
    // Future migrations: if (version === "1") { migrate to v2 }
  } catch {
    // silently fail
  }
}
