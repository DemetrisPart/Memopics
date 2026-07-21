import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EventStatus,
  MediaAssetStatus,
  MediaAssetType,
  MediaVariantType,
  PrivacyMode,
  type Prisma,
} from "@memopics/database";
import {
  STORAGE_SERVICE,
  normalizeEventSlug,
  validateEventSlug,
  type StorageService,
} from "@memopics/domain";
import { MVP_DEFAULTS } from "@memopics/shared";
import { PrismaService } from "../prisma/prisma.service";
import type { GuestSessionContext } from "../public/guest-session.guard";

const DEFAULT_GALLERY_LIMIT = 24;

type GalleryCursor = {
  createdAt: string;
  id: string;
};

type MediaWithVariants = Prisma.MediaAssetGetPayload<{
  include: {
    variants: true;
    guestSession: { select: { firstName: true; lastName: true } };
  };
}>;

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async listGallery(
    slug: string,
    guestSession: GuestSessionContext,
    options: { cursor?: string; limit?: number },
  ) {
    const event = await this.findActiveEventBySlug(slug);

    if (guestSession.eventId !== event.id) {
      throw new NotFoundException("Event not found");
    }

    const limit = options.limit ?? DEFAULT_GALLERY_LIMIT;
    const cursor = options.cursor
      ? this.decodeCursor(options.cursor)
      : undefined;

    const where = this.buildGalleryWhere(event.id, event.privacyMode, guestSession.id);

    const totalCount = await this.prisma.mediaAsset.count({ where });

    const pageWhere: Prisma.MediaAssetWhereInput = cursor
      ? {
          ...where,
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              createdAt: new Date(cursor.createdAt),
              id: { lt: cursor.id },
            },
          ],
        }
      : where;

    const media = await this.prisma.mediaAsset.findMany({
      where: pageWhere,
      include: {
        variants: true,
        guestSession: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = media.length > limit;
    const page = hasMore ? media.slice(0, limit) : media;

    const items = await Promise.all(
      page.map((asset) =>
        this.serializeGalleryItem(asset, event, guestSession.id),
      ),
    );

    const lastItem = page.at(-1);
    const nextCursor =
      hasMore && lastItem
        ? this.encodeCursor({
            createdAt: lastItem.createdAt.toISOString(),
            id: lastItem.id,
          })
        : null;

    return {
      items,
      nextCursor,
      totalCount,
      privacyMode: event.privacyMode,
      showGuestNamesPublicly: event.showGuestNamesPublicly,
    };
  }

  async getMediaUrl(
    slug: string,
    mediaId: string,
    guestSession: GuestSessionContext,
    variant: "thumb" | "web" = "web",
  ) {
    const event = await this.findActiveEventBySlug(slug);

    if (guestSession.eventId !== event.id) {
      throw new NotFoundException("Event not found");
    }

    const where = this.buildGalleryWhere(event.id, event.privacyMode, guestSession.id);

    const media = await this.prisma.mediaAsset.findFirst({
      where: {
        ...where,
        id: mediaId,
      },
      include: { variants: true },
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    const variantType =
      variant === "thumb" ? MediaVariantType.THUMB : MediaVariantType.WEB;
    const mediaVariant = media.variants.find((v) => v.variant === variantType);

    if (!mediaVariant) {
      throw new NotFoundException("Media variant not available");
    }

    const urls = await this.storage.getPresignedDownloadUrls({
      key: mediaVariant.storageKey,
      expiresInSeconds: MVP_DEFAULTS.PRESIGNED_DOWNLOAD_TTL_SECONDS,
    });

    return {
      url: urls.url,
      urlLan: urls.lanUrl ?? null,
      urlPublic: urls.publicUrl ?? null,
      variant,
      mediaId: media.id,
      width: media.width,
      height: media.height,
    };
  }

  async deleteGuestMedia(
    slug: string,
    mediaId: string,
    guestSession: GuestSessionContext,
  ) {
    const event = await this.findActiveEventBySlug(slug);

    if (guestSession.eventId !== event.id) {
      throw new NotFoundException("Event not found");
    }

    const media = await this.prisma.mediaAsset.findFirst({
      where: {
        id: mediaId,
        eventId: event.id,
        guestSessionId: guestSession.id,
        deletedAt: null,
        status: MediaAssetStatus.ACTIVE,
        type: MediaAssetType.PHOTO,
      },
      include: { variants: true },
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    const bytesToFree =
      media.originalSizeBytes +
      media.variants.reduce(
        (sum, variant) => sum + variant.sizeBytes,
        BigInt(0),
      );

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaAsset.update({
        where: { id: media.id },
        data: { deletedAt: new Date() },
      });

      const eventUpdate: Prisma.EventUpdateInput = {
        storageUsedBytes: {
          decrement: bytesToFree,
        },
      };

      if (event.coverImageMediaId === media.id) {
        eventUpdate.coverImage = { disconnect: true };
      }

      await tx.event.update({
        where: { id: event.id },
        data: eventUpdate,
      });
    });

    return { deleted: true as const, mediaId: media.id };
  }

  private buildGalleryWhere(
    eventId: string,
    privacyMode: PrivacyMode,
    guestSessionId: string,
  ): Prisma.MediaAssetWhereInput {
    const base: Prisma.MediaAssetWhereInput = {
      eventId,
      deletedAt: null,
      status: MediaAssetStatus.ACTIVE,
      type: MediaAssetType.PHOTO,
    };

    if (privacyMode === PrivacyMode.OWN_UPLOADS_ONLY) {
      return {
        ...base,
        guestSessionId,
      };
    }

    return base;
  }

  private async serializeGalleryItem(
    media: MediaWithVariants,
    event: { privacyMode: PrivacyMode; showGuestNamesPublicly: boolean },
    viewingGuestSessionId: string,
  ) {
    const thumbVariant = media.variants.find(
      (v) => v.variant === MediaVariantType.THUMB,
    );

    const thumbUrls = thumbVariant
      ? await this.storage.getPresignedDownloadUrls({
          key: thumbVariant.storageKey,
          expiresInSeconds: MVP_DEFAULTS.PRESIGNED_DOWNLOAD_TTL_SECONDS,
        })
      : null;

    return {
      id: media.id,
      thumbUrl: thumbUrls?.url ?? null,
      thumbUrlLan: thumbUrls?.lanUrl ?? null,
      thumbUrlPublic: thumbUrls?.publicUrl ?? null,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt.toISOString(),
      guestLabel: this.formatGuestLabel(media, event),
      canDelete: media.guestSessionId === viewingGuestSessionId,
    };
  }

  private formatGuestLabel(
    media: MediaWithVariants,
    event: { privacyMode: PrivacyMode; showGuestNamesPublicly: boolean },
  ): string | null {
    if (event.privacyMode === PrivacyMode.OWN_UPLOADS_ONLY) {
      return null;
    }

    if (!event.showGuestNamesPublicly || !media.guestSession) {
      return "Guest";
    }

    const { firstName, lastName } = media.guestSession;
    if (lastName?.trim()) {
      return `${firstName} ${lastName.trim().charAt(0).toUpperCase()}.`;
    }

    return firstName;
  }

  private encodeCursor(cursor: GalleryCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
  }

  private decodeCursor(cursor: string): GalleryCursor {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf8"),
      ) as GalleryCursor;

      if (!parsed.createdAt || !parsed.id) {
        throw new Error("Invalid cursor");
      }

      return parsed;
    } catch {
      throw new NotFoundException("Invalid gallery cursor");
    }
  }

  private async findActiveEventBySlug(slug: string) {
    const normalized = normalizeEventSlug(slug);
    const slugResult = validateEventSlug(normalized);
    if (!slugResult.valid || !slugResult.normalized) {
      throw new NotFoundException("Event not found");
    }

    const event = await this.prisma.event.findFirst({
      where: {
        slug: slugResult.normalized,
        deletedAt: null,
        status: EventStatus.ACTIVE,
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
  }
}
