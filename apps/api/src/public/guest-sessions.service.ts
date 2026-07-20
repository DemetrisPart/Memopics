import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { EventStatus } from "@memopics/database";
import {
  normalizeEventSlug,
  validateEventSlug,
} from "@memopics/domain";
import { MVP_DEFAULTS } from "@memopics/shared";
import {
  generateSecureToken,
  hashToken,
} from "../common/crypto.util";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateGuestSessionDto } from "./dto/guest-session.dto";
import type { GuestSessionContext } from "./guest-session.guard";

@Injectable()
export class GuestSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createSession(
    slug: string,
    dto: CreateGuestSessionDto,
    ipAddress?: string,
  ) {
    const event = await this.findActiveEventBySlug(slug);
    const sessionToken = generateSecureToken(32);
    const sessionTokenHash = hashToken(sessionToken);
    const ipHash = ipAddress ? hashToken(ipAddress) : null;

    const session = await this.prisma.guestSession.create({
      data: {
        eventId: event.id,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        sessionTokenHash,
        ipHash,
      },
    });

    return {
      session,
      sessionToken,
      eventSlug: event.slug,
    };
  }

  async resolveSessionForSlug(
    token: string,
    slug: string,
  ): Promise<GuestSessionContext | null> {
    const event = await this.findActiveEventBySlug(slug);
    const sessionTokenHash = hashToken(token);

    const session = await this.prisma.guestSession.findFirst({
      where: {
        sessionTokenHash,
        eventId: event.id,
        deletedAt: null,
      },
    });

    if (!session) {
      return null;
    }

    const ttlMs = MVP_DEFAULTS.GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000;
    const expiresAt = session.createdAt.getTime() + ttlMs;
    if (Date.now() > expiresAt) {
      return null;
    }

    await this.prisma.guestSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      id: session.id,
      eventId: session.eventId,
      firstName: session.firstName,
      lastName: session.lastName,
    };
  }

  setGuestSessionCookie(res: Response, sessionToken: string): void {
    const isProd = this.config.get("NODE_ENV") === "production";
    const cookieName = this.config.get<string>(
      "GUEST_SESSION_COOKIE",
      "memopics_guest",
    );
    const maxAgeMs =
      MVP_DEFAULTS.GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000;

    res.cookie(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeMs,
    });
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
