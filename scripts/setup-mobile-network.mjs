/**
 * Documents dual-endpoint mobile dev setup (Wi-Fi + 4G/5G without manual switching).
 * Safe to run — only adds missing keys; does not print secrets.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");
const EXAMPLE_PATH = resolve(ROOT, ".env.example");

const LAN_IP = process.env.MOBILE_LAN_IP ?? "192.168.0.105";
const PUBLIC_HOST = process.env.MOBILE_PUBLIC_HOST ?? "";

const ENTRIES: Record<string, string> = {
  STORAGE_LAN_ENDPOINT: `http://${LAN_IP}:9000`,
  NEXT_PUBLIC_MOBILE_LAN_ORIGIN: `http://${LAN_IP}:3000`,
};

if (PUBLIC_HOST) {
  ENTRIES.STORAGE_PUBLIC_ENDPOINT = `http://${PUBLIC_HOST}:9000`;
  ENTRIES.NEXT_PUBLIC_MOBILE_PUBLIC_ORIGIN = `http://${PUBLIC_HOST}:3000`;
  ENTRIES.PUBLIC_EVENT_BASE_URL = `http://${PUBLIC_HOST}:3000`;
}

if (!PUBLIC_HOST) {
  ENTRIES.PUBLIC_EVENT_BASE_URL = `http://${LAN_IP}:3000`;
}

if (!existsSync(ENV_PATH)) {
  if (existsSync(EXAMPLE_PATH)) {
    copyFileSync(EXAMPLE_PATH, ENV_PATH);
    console.log("Created .env from .env.example");
  } else {
    writeFileSync(ENV_PATH, "", "utf8");
    console.log("Created empty .env");
  }
}

let content = readFileSync(ENV_PATH, "utf8");
let changed = false;

for (const [key, value] of Object.entries(ENTRIES)) {
  if (content.includes(`${key}=`)) continue;
  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  content = `${content}${suffix}${key}=${value}\n`;
  changed = true;
  console.log(`Added ${key}`);
}

if (changed) {
  writeFileSync(ENV_PATH, content, "utf8");
} else {
  console.log("Mobile network env keys already present in .env");
}

if (!PUBLIC_HOST) {
  console.log("");
  console.log("Tip: for 4G/5G testing, re-run with a Tailscale/ngrok host:");
  console.log("  MOBILE_PUBLIC_HOST=100.x.x.x node scripts/setup-mobile-network.mjs");
}

console.log("Restart API and web dev servers after .env changes.");
