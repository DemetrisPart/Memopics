const ACCESS_KEY = "momeva_couple_access";
const REFRESH_KEY = "momeva_couple_refresh";

export function setCoupleSessionTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getCoupleAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getCoupleRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function clearCoupleSessionTokens(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function coupleAuthHeaders(): Record<string, string> {
  const access = getCoupleAccessToken();
  return access ? { Authorization: `Bearer ${access}` } : {};
}
