/**
 * Dev-only: wipe guest uploads/sessions for one event (fresh QR test).
 * Usage:
 *   node scripts/reset-event-guest-data.mjs wedding-jul-2026
 *   node scripts/reset-event-guest-data.mjs wedding-jul-2026 --date 2026-10-03
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "packages/database/package.json"));
const { PrismaClient } = require("@prisma/client");
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

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--")) ?? "wedding-jul-2026";
const dateIdx = args.indexOf("--date");
const eventDate = dateIdx !== -1 ? args[dateIdx + 1] : null;

const prisma = new PrismaClient();

function buildEventTitle(brideName, groomName) {
  const bride = brideName?.trim();
  const groom = groomName?.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Our Event";
}

try {
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
  });

  if (!event) {
    console.error(`No event found with slug: ${slug}`);
    process.exit(1);
  }

  const before = await prisma.$transaction([
    prisma.guestSession.count({ where: { eventId: event.id, deletedAt: null } }),
    prisma.mediaAsset.count({ where: { eventId: event.id, deletedAt: null } }),
    prisma.uploadBatch.count({ where: { eventId: event.id, deletedAt: null } }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: event.id },
      data: { coverImageMediaId: null },
    });

    await tx.mediaVariant.deleteMany({
      where: { mediaAsset: { eventId: event.id } },
    });

    await tx.mediaAsset.deleteMany({ where: { eventId: event.id } });
    await tx.uploadBatch.deleteMany({ where: { eventId: event.id } });
    await tx.guestSession.deleteMany({ where: { eventId: event.id } });

    const brideName = event.brideName ?? "Daniella";
    const groomName = event.groomName ?? "Demetris";

    await tx.event.update({
      where: { id: event.id },
      data: {
        brideName,
        groomName,
        title: buildEventTitle(brideName, groomName),
        storageUsedBytes: 0n,
        ...(eventDate
          ? { eventDate: new Date(`${eventDate}T12:00:00.000Z`) }
          : {}),
      },
    });
  });

  const updated = await prisma.event.findUnique({ where: { id: event.id } });

  console.log(
    JSON.stringify(
      {
        slug,
        title: updated.title,
        eventDate: updated.eventDate.toISOString().slice(0, 10),
        removed: {
          guestSessions: before[0],
          mediaAssets: before[1],
          uploadBatches: before[2],
        },
        urls: {
          landing: `http://192.168.0.105:3000/${slug}`,
          qr: `http://192.168.0.105:3000/${slug}/qr`,
        },
        nextStep:
          "Open QR in Safari Private tab (or clear site data) so name entry appears again.",
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
