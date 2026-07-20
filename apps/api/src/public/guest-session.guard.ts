import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { hashToken } from "../common/crypto.util";
import { GuestSessionsService } from "./guest-sessions.service";

export type GuestSessionContext = {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string | null;
};

export type GuestAuthenticatedRequest = Request & {
  guestSession: GuestSessionContext;
};

@Injectable()
export class GuestSessionGuard implements CanActivate {
  constructor(
    private readonly guestSessionsService: GuestSessionsService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const slug = request.params.slug as string | undefined;

    if (!slug) {
      throw new UnauthorizedException("Guest session required");
    }

    const cookieName = this.config.get<string>(
      "GUEST_SESSION_COOKIE",
      "memopics_guest",
    );
    const token = request.cookies?.[cookieName] as string | undefined;

    if (!token) {
      throw new UnauthorizedException("Guest session required");
    }

    const session = await this.guestSessionsService.resolveSessionForSlug(
      token,
      slug,
    );

    if (!session) {
      throw new UnauthorizedException("Guest session expired or invalid");
    }

    (request as GuestAuthenticatedRequest).guestSession = session;
    return true;
  }
}

export function getGuestSessionTokenFromRequest(
  req: Request,
  config: ConfigService,
): string | undefined {
  const cookieName = config.get<string>(
    "GUEST_SESSION_COOKIE",
    "memopics_guest",
  );
  return req.cookies?.[cookieName] as string | undefined;
}

export function hashGuestSessionToken(token: string): string {
  return hashToken(token);
}
