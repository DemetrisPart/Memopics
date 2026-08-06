import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GalleryModule } from "../gallery/gallery.module";
import { StorageModule } from "../storage/storage.module";
import { CoupleGalleryController } from "./couple-gallery.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { EventOwnerGuard } from "./guards/event-owner.guard";
import { PublicEventsController } from "./public-events.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [AuthModule, StorageModule, GalleryModule],
  controllers: [EventsController, PublicEventsController, CoupleGalleryController],
  providers: [EventsService, QrService, EventOwnerGuard],
  exports: [EventsService, EventOwnerGuard],
})
export class EventsModule {}
