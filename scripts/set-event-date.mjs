/**
 * Updates event date by slug. Usage:
 *   node scripts/set-event-date.mjs wedding-jul-2026 2026-10-03
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const slug = process.argv[2] ?? "wedding-jul-2026";
const dateStr = process.argv[3] ?? "2026-10-03";

const prisma = new PrismaClient();

try {
  const result = await prisma.event.updateMany({
    where: { slug, deletedAt: null },
    data: { eventDate: new Date(`${dateStr}T12:00:00.000Z`) },
  });
  if (result.count === 0) {
    console.error(`No event found with slug: ${slug}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ slug, eventDate: dateStr, updated: result.count }, null, 2));
} finally {
  await prisma.$disconnect();
}
