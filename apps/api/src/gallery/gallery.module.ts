import { Module } from "@nestjs/common";
import { PublicModule } from "../public/public.module";
import { GalleryController } from "./gallery.controller";
import { GalleryService } from "./gallery.service";

@Module({
  imports: [PublicModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
