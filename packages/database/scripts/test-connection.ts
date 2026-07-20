/**
 * Database connection smoke test.
 * Usage: pnpm --filter @memopics/database test:connection
 * Requires: DATABASE_URL in environment (see .env.example)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(resolve(__dirname, "../.env"));
loadEnvFile(resolve(__dirname, "../../../.env"));

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    const tableCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    console.log("Database connection: OK");
    console.log(`Ping result: ${result[0]?.ok}`);
    console.log(`Public tables: ${tableCount[0]?.count ?? 0}`);
    process.exit(0);
  } catch (error) {
    console.error("Database connection: FAILED");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
