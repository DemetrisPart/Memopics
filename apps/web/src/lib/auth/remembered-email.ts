const KEY = "momeva_remembered_email";

/** Prefer sessionStorage — works in Mobile Preview where localStorage is often blocked. */
export function saveRememberedEmail(email: string): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, trimmed);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(KEY, trimmed);
  } catch {
    // ignore
  }
}

export function readRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(KEY)?.trim();
    if (fromSession) return fromSession;
  } catch {
    // ignore
  }
  try {
    const fromLocal = localStorage.getItem(KEY)?.trim();
    if (fromLocal) return fromLocal;
  } catch {
    // ignore
  }
  return null;
}
