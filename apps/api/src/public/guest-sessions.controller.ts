import { Body, Controller, Param, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { getClientIp } from "../common/client-ip.util";
import { RateLimitService } from "../rate-limit/rate-limit.service";
import { CreateGuestSessionDto } from "./dto/guest-session.dto";
import { GuestSessionsService } from "./guest-sessions.service";

@Controller("public/events")
export class GuestSessionsController {
  constructor(
    private readonly guestSessionsService: GuestSessionsService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Post(":slug/guest-session")
  async create(
    @Param("slug") slug: string,
    @Body() dto: CreateGuestSessionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.rateLimit.assertGuestSessionCreateLimit(getClientIp(req));

    const { session, sessionToken } =
      await this.guestSessionsService.createSession(
        slug,
        dto,
        getClientIp(req),
      );

    this.guestSessionsService.setGuestSessionCookie(res, sessionToken);

    return {
      firstName: session.firstName,
      lastName: session.lastName,
      expiresInHours: 24,
    };
  }
}
