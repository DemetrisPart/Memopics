export type NetworkMode = "lan" | "public";

const MODE_KEY = "memopics_network_mode";

type UrlSet = {
  url: string;
  lanUrl?: string | null;
  publicUrl?: string | null;
};

export function getMobileOrigins(): {
  lan: string | undefined;
  publicOrigin: string | undefined;
} {
  return {
    lan: process.env.NEXT_PUBLIC_MOBILE_LAN_ORIGIN,
    publicOrigin: process.env.NEXT_PUBLIC_MOBILE_PUBLIC_ORIGIN,
  };
}

export function isMobileNetworkConfigured(): boolean {
  const { lan, publicOrigin } = getMobileOrigins();
  return Boolean(lan || publicOrigin);
}

export function getNetworkMode(): NetworkMode | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(MODE_KEY);
  return value === "lan" || value === "public" ? value : null;
}

export function setNetworkMode(mode: NetworkMode): void {
  sessionStorage.setItem(MODE_KEY, mode);
}

async function probeOrigin(origin: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${origin}/api/network-probe`, {
      signal: controller.signal,
      cache: "no-store",
      mode: "cors",
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export async function detectBestNetworkMode(): Promise<NetworkMode> {
  const { lan, publicOrigin } = getMobileOrigins();

  if (lan && publicOrigin) {
    const [lanOk, publicOk] = await Promise.all([
      probeOrigin(lan),
      probeOrigin(publicOrigin),
    ]);
    if (lanOk && publicOk) return "lan";
    if (lanOk) return "lan";
    if (publicOk) return "public";
    return "public";
  }

  if (lan) {
    return (await probeOrigin(lan)) ? "lan" : "public";
  }

  if (publicOrigin) {
    return (await probeOrigin(publicOrigin)) ? "public" : "lan";
  }

  return "public";
}

export function resolveNetworkUrl(urls: UrlSet): string {
  const mode = getNetworkMode();

  if (mode === "lan" && urls.lanUrl) return urls.lanUrl;
  if (mode === "public" && urls.publicUrl) return urls.publicUrl;
  if (urls.lanUrl && !urls.publicUrl) return urls.lanUrl;
  if (urls.publicUrl && !urls.lanUrl) return urls.publicUrl;
  return urls.url;
}

export function getRedirectTarget(
  mode: NetworkMode,
  pathname: string,
): string | null {
  if (typeof window === "undefined") return null;

  const { lan, publicOrigin } = getMobileOrigins();
  const targetOrigin = mode === "lan" ? lan : publicOrigin;
  if (!targetOrigin) return null;

  const currentOrigin = window.location.origin;
  if (currentOrigin === targetOrigin) return null;

  return `${targetOrigin}${pathname}${window.location.search}`;
}

const PROBE_DONE_KEY = "memopics_network_probe_done";

export function hasCachedNetworkProbe(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PROBE_DONE_KEY) === "1";
}

export function markNetworkProbeDone(): void {
  sessionStorage.setItem(PROBE_DONE_KEY, "1");
}

export async function ensureMobileNetworkRoute(
  pathname: string,
): Promise<NetworkMode | null> {
  if (!isMobileNetworkConfigured()) return null;

  const mode = await detectBestNetworkMode();
  setNetworkMode(mode);

  const target = getRedirectTarget(mode, pathname);
  if (target) {
    window.location.replace(target);
    return mode;
  }

  markNetworkProbeDone();
  return mode;
}
