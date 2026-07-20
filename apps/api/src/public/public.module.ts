import { Module } from "@nestjs/common";
import { GuestSessionGuard } from "./guest-session.guard";
import { GuestSessionsController } from "./guest-sessions.controller";
import { GuestSessionsService } from "./guest-sessions.service";

@Module({
  controllers: [GuestSessionsController],
  providers: [GuestSessionsService, GuestSessionGuard],
  exports: [GuestSessionsService, GuestSessionGuard],
})
export class PublicModule {}
