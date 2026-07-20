import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { JwtPayload } from "@memopics/domain";
import { ConfigService } from "@nestjs/config";
import { TokenService } from "./token.service";

export type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieName = this.config.get<string>(
      "ACCESS_TOKEN_COOKIE",
      "memopics_access",
    );
    const token =
      request.cookies?.[cookieName] ??
      this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      (request as AuthenticatedRequest).user =
        this.tokenService.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }

  private extractBearerToken(header?: string): string | undefined {
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice(7);
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

export function setAuthCookies(
  res: Response,
  config: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const isProd = config.get("NODE_ENV") === "production";
  const accessName = config.get<string>("ACCESS_TOKEN_COOKIE", "memopics_access");
  const refreshName = config.get<string>(
    "REFRESH_TOKEN_COOKIE",
    "memopics_refresh",
  );

  res.cookie(accessName, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(refreshName, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response, config: ConfigService): void {
  const accessName = config.get<string>("ACCESS_TOKEN_COOKIE", "memopics_access");
  const refreshName = config.get<string>(
    "REFRESH_TOKEN_COOKIE",
    "memopics_refresh",
  );
  res.clearCookie(accessName, { path: "/" });
  res.clearCookie(refreshName, { path: "/" });
}

export function getRefreshTokenFromRequest(
  req: Request,
  config: ConfigService,
): string | undefined {
  const refreshName = config.get<string>(
    "REFRESH_TOKEN_COOKIE",
    "memopics_refresh",
  );
  return req.cookies?.[refreshName];
}
