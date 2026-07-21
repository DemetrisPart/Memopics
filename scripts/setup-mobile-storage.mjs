/**
 * Ensures STORAGE_PUBLIC_ENDPOINT is set for mobile LAN upload testing.
 * Safe to run — only adds one line if missing; does not print secrets.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");
const EXAMPLE_PATH = resolve(ROOT, ".env.example");
const LAN_ENDPOINT = "http://192.168.0.105:9000";
const KEY = "STORAGE_PUBLIC_ENDPOINT";

if (!existsSync(ENV_PATH)) {
  if (existsSync(EXAMPLE_PATH)) {
    copyFileSync(EXAMPLE_PATH, ENV_PATH);
    console.log("Created .env from .env.example");
  } else {
    writeFileSync(ENV_PATH, `${KEY}=${LAN_ENDPOINT}\n`, "utf8");
    console.log("Created .env with STORAGE_PUBLIC_ENDPOINT");
    process.exit(0);
  }
}

const content = readFileSync(ENV_PATH, "utf8");
if (content.includes(`${KEY}=`)) {
  console.log("STORAGE_PUBLIC_ENDPOINT already set in .env");
} else {
  const suffix = content.endsWith("\n") ? "" : "\n";
  writeFileSync(ENV_PATH, `${content}${suffix}${KEY}=${LAN_ENDPOINT}\n`, "utf8");
  console.log(`Added ${KEY}=${LAN_ENDPOINT} to .env`);
}

console.log("Restart the API (pnpm --filter @memopics/api dev) for changes to apply.");
