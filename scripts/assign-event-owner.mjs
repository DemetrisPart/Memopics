/**
 * Assign an event to a couple account by email.
 * Creates the user if they don't exist yet (then use Sign in + Mailpit magic link).
 *
 * Usage:
 *   node scripts/assign-event-owner.mjs wedding-jul-2026 partasas96@icloud.com
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

const slug = process.argv[2];
const emailArg = process.argv[3];

if (!slug || !emailArg) {
  console.error(
    "Usage: node scripts/assign-event-owner.mjs <slug> <email>",
  );
  console.error(
    "Example: node scripts/assign-event-owner.mjs wedding-jul-2026 partasas96@icloud.com",
  );
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const prisma = new PrismaClient();

try {
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      ownerUserId: true,
      owner: { select: { email: true } },
    },
  });

  if (!event) {
    console.error(`No event found with slug: ${slug}`);
    process.exit(1);
  }

  let user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true },
  });

  let userCreated = false;
  if (!user) {
    user = await prisma.user.create({
      data: { email },
      select: { id: true, email: true },
    });
    userCreated = true;
  }

  if (event.ownerUserId === user.id) {
    console.log(
      JSON.stringify(
        {
          status: "unchanged",
          slug: event.slug,
          ownerEmail: user.email,
          message: "Event already owned by this account",
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const previousOwnerEmail = event.owner.email;

  await prisma.event.update({
    where: { id: event.id },
    data: { ownerUserId: user.id },
  });

  console.log(
    JSON.stringify(
      {
        status: "assigned",
        slug: event.slug,
        title: event.title,
        ownerEmail: user.email,
        userCreated,
        previousOwnerEmail,
        dashboardUrl: `${process.env.WEB_APP_URL ?? "http://localhost:3000"}/dashboard/events/${event.id}`,
        guestUrl: `${process.env.WEB_APP_URL ?? "http://localhost:3000"}/${event.slug}`,
        nextSteps: userCreated
          ? [
              "Open /auth/login and use Sign in (account now exists)",
              "Magic link arrives in Mailpit: http://localhost:8025",
            ]
          : [
              "Open /auth/login and use Sign in",
              "Magic link arrives in Mailpit: http://localhost:8025",
            ],
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
