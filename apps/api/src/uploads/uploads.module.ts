import { Module } from "@nestjs/common";
import { PublicModule } from "../public/public.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [PublicModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
