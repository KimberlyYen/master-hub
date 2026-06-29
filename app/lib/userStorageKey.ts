import type { Session } from "next-auth";

export type TopPreferences = [string | null, string | null, string | null];

export const LEGACY_PREFERENCES_KEY = "master-hub:preferences";

export function resolveUserStorageKey(
  session: Session | null,
  isGuest: boolean
): string {
  const email = session?.user?.email?.trim().toLowerCase();
  if (email) return email;
  const id = session?.user?.id?.trim();
  if (id) return `uid:${id}`;
  if (isGuest) return "guest";
  return "anonymous";
}

export function preferencesStorageKey(userKey: string): string {
  return `master-hub:preferences:${userKey}`;
}

function readPreferences(key: string): TopPreferences | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    return parsed.map((v) => (typeof v === "string" ? v : null)) as TopPreferences;
  } catch {
    return null;
  }
}

function isEmptyPreferences(prefs: TopPreferences | null): boolean {
  return !prefs || prefs.every((id) => !id);
}

export function loadPreferencesForUser(userKey: string): TopPreferences {
  const empty: TopPreferences = [null, null, null];
  const primaryKey = preferencesStorageKey(userKey);
  let prefs = readPreferences(primaryKey);

  if (isEmptyPreferences(prefs)) {
    const legacy = readPreferences(LEGACY_PREFERENCES_KEY);
    if (!isEmptyPreferences(legacy)) {
      localStorage.setItem(primaryKey, JSON.stringify(legacy));
      prefs = legacy;
    }
  }

  if (isEmptyPreferences(prefs) && userKey.includes("@")) {
    const guest = readPreferences(preferencesStorageKey("guest"));
    if (!isEmptyPreferences(guest)) {
      localStorage.setItem(primaryKey, JSON.stringify(guest));
      prefs = guest;
    }
  }

  return prefs ?? empty;
}

export function savePreferencesForUser(
  userKey: string,
  prefs: TopPreferences
): void {
  localStorage.setItem(preferencesStorageKey(userKey), JSON.stringify(prefs));
}
