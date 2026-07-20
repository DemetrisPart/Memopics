import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthTokens, JwtPayload } from "@memopics/domain";
import { addDays, addMinutes } from "../common/crypto.util";

const ACCESS_TTL_MINUTES = 15;
const REFRESH_TTL_DAYS = 7;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: JwtPayload): { token: string; expiresAt: Date } {
    const expiresAt = addMinutes(new Date(), ACCESS_TTL_MINUTES);
    const token = this.jwtService.sign(
      { ...payload, type: "access" },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: `${ACCESS_TTL_MINUTES}m`,
      },
    );
    return { token, expiresAt };
  }

  signRefreshToken(payload: JwtPayload): { token: string; expiresAt: Date } {
    const expiresAt = addDays(new Date(), REFRESH_TTL_DAYS);
    const token = this.jwtService.sign(
      { ...payload, type: "refresh" },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: `${REFRESH_TTL_DAYS}d`,
      },
    );
    return { token, expiresAt };
  }

  createTokenPair(userId: string, email: string, role: string): AuthTokens {
    const payload: JwtPayload = { sub: userId, email, role };
    const access = this.signAccessToken(payload);
    const refresh = this.signRefreshToken(payload);
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessExpiresAt: access.expiresAt,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    const payload = this.jwtService.verify<JwtPayload & { type?: string }>(
      token,
      { secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET") },
    );
    if (payload.type !== "access") {
      throw new Error("Invalid token type");
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }

  verifyRefreshToken(token: string): JwtPayload {
    const payload = this.jwtService.verify<JwtPayload & { type?: string }>(
      token,
      { secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET") },
    );
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
