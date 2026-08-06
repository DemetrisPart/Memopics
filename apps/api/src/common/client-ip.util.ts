import type { Request } from "express";

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1", "unknown"]);

/** High-frequency read endpoints — excluded from the global per-IP bucket. */
const GLOBAL_RATE_LIMIT_EXEMPT = [
  /^\/v1\/auth\/magic-link\/status$/,
  /^\/v1\/events\/[^/]+\/media\/[^/]+\/url$/,
  /^\/v1\/public\/events\/[^/]+\/media\/[^/]+\/url$/,
];

export function isLoopbackClientIp(ip: string): boolean {
  return LOOPBACK.has(ip);
}

export function isGlobalRateLimitExemptPath(path: string): boolean {
  return GLOBAL_RATE_LIMIT_EXEMPT.some((pattern) => pattern.test(path));
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  return ip;
}
