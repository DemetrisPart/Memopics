import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { EventOwnerGuard } from "./guards/event-owner.guard";
import { PublicEventsController } from "./public-events.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService, QrService, EventOwnerGuard],
  exports: [EventsService],
})
export class EventsModule {}
