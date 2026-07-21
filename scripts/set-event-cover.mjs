/**
 * Upload a cover photo for an event by slug (dev script, direct DB + MinIO).
 *
 * Usage:
 *   node scripts/set-event-cover.mjs wedding-jul-2026 path/to/photo.jpg
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

const requireStorage = createRequire(
  resolve(dirname(fileURLToPath(import.meta.url)), "../packages/storage/package.json"),
);
const requireDb = createRequire(
  resolve(dirname(fileURLToPath(import.meta.url)), "../packages/database/package.json"),
);
const { PutObjectCommand, S3Client } = requireStorage("@aws-sdk/client-s3");
const { PrismaClient, MediaAssetStatus, MediaAssetType } = requireDb("@prisma/client");

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
const imagePath = process.argv[3];

if (!imagePath) {
  console.error("Usage: node scripts/set-event-cover.mjs <slug> <image-path>");
  process.exit(1);
}

const absoluteImagePath = resolve(process.cwd(), imagePath);
if (!existsSync(absoluteImagePath)) {
  console.error(`Image not found: ${absoluteImagePath}`);
  process.exit(1);
}

const ext = extname(absoluteImagePath).toLowerCase();
const contentTypeByExt = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const contentType = contentTypeByExt[ext];
if (!contentType) {
  console.error(`Unsupported image type: ${ext}`);
  process.exit(1);
}

function buildMediaOriginalKey(env, eventId, mediaId, extension) {
  const normalized = extension.replace(/^\./, "").toLowerCase();
  return `${env}/events/${eventId}/originals/${mediaId}.${normalized}`;
}

const prisma = new PrismaClient();
const fileBuffer = readFileSync(absoluteImagePath);

try {
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, slug: true, coverImageMediaId: true },
  });

  if (!event) {
    console.error(`No event found with slug: ${slug}`);
    process.exit(1);
  }

  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const region = process.env.STORAGE_REGION ?? "auto";
  const appEnv = process.env.APP_ENV ?? "development";

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    console.error("Missing storage env vars in .env");
    process.exit(1);
  }

  const mediaId = randomUUID();
  const storageKey = buildMediaOriginalKey(appEnv, event.id, mediaId, ext);
  const contentLength = fileBuffer.length;

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== "false",
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  const previousCoverId = event.coverImageMediaId;

  await prisma.$transaction(async (tx) => {
    if (previousCoverId) {
      await tx.mediaAsset.update({
        where: { id: previousCoverId },
        data: { deletedAt: new Date() },
      });
    }

    await tx.mediaAsset.create({
      data: {
        id: mediaId,
        eventId: event.id,
        type: MediaAssetType.PHOTO,
        status: MediaAssetStatus.ACTIVE,
        originalKey: storageKey,
        originalSizeBytes: BigInt(contentLength),
        mimeType: contentType,
      },
    });

    await tx.event.update({
      where: { id: event.id },
      data: { coverImageMediaId: mediaId },
    });
  });

  console.log(
    JSON.stringify(
      {
        slug: event.slug,
        image: basename(absoluteImagePath),
        bytes: contentLength,
        mediaId,
        storageKey,
        status: "cover_set",
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
