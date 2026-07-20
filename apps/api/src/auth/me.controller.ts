import { Controller, Get, UseGuards } from "@nestjs/common";
import type { JwtPayload } from "@memopics/domain";
import { AuthService } from "./auth.service";
import { CurrentUser, JwtAuthGuard } from "./auth.guard";

@Controller()
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
