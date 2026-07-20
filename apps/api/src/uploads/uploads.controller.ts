import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import {
  GuestSessionGuard,
  type GuestAuthenticatedRequest,
  type GuestSessionContext,
} from "../public/guest-session.guard";
import { UploadCompleteDto, UploadInitDto } from "./dto/upload.dto";
import { UploadsService } from "./uploads.service";

export const CurrentGuestSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuestSessionContext => {
    const request = ctx.switchToHttp().getRequest<GuestAuthenticatedRequest>();
    return request.guestSession;
  },
);

@Controller("public/events/:slug/uploads")
@UseGuards(GuestSessionGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("init")
  init(
    @Param("slug") slug: string,
    @CurrentGuestSession() guestSession: GuestSessionContext,
    @Body() dto: UploadInitDto,
  ) {
    return this.uploadsService.initUpload(slug, guestSession, dto);
  }

  @Post(":batchId/complete")
  complete(
    @Param("slug") slug: string,
    @Param("batchId") batchId: string,
    @CurrentGuestSession() guestSession: GuestSessionContext,
    @Body() dto: UploadCompleteDto,
  ) {
    return this.uploadsService.completeUpload(
      slug,
      batchId,
      guestSession,
      dto,
    );
  }
}
