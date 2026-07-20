import { Controller, Get, Post, Req, Res, UnauthorizedException, Body } from "@nestjs/common";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { MagicLinkDto, RegisterDto, VerifyMagicLinkDto } from "./dto/auth.dto";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email);
  }

  @Post("magic-link")
  async magicLink(@Body() dto: MagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post("verify")
  async verify(
    @Body() dto: VerifyMagicLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.verifyMagicLink(dto.token);
    setAuthCookies(res, this.config, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    return {
      message: "Authenticated",
      userId: session.userId,
    };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = getRefreshTokenFromRequest(req, this.config);
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token");
    }
    const session = await this.authService.refreshSession(refreshToken);
    setAuthCookies(res, this.config, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    return { message: "Session refreshed" };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = getRefreshTokenFromRequest(req, this.config);
    clearAuthCookies(res, this.config);
    return this.authService.logout(refreshToken);
  }
}
