import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import {
  GuestSessionGuard,
  type GuestAuthenticatedRequest,
  type GuestSessionContext,
} from "../public/guest-session.guard";

const CurrentGuestSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuestSessionContext => {
    const request = ctx.switchToHttp().getRequest<GuestAuthenticatedRequest>();
    return request.guestSession;
  },
);
import { GalleryQueryDto, MediaUrlQueryDto } from "./dto/gallery-query.dto";
import { GalleryService } from "./gallery.service";

@Controller("public/events/:slug")
@UseGuards(GuestSessionGuard)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get("gallery")
  listGallery(
    @Param("slug") slug: string,
    @CurrentGuestSession() guestSession: GuestSessionContext,
    @Query() query: GalleryQueryDto,
  ) {
    return this.galleryService.listGallery(slug, guestSession, {
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Get("media/:mediaId/url")
  getMediaUrl(
    @Param("slug") slug: string,
    @Param("mediaId") mediaId: string,
    @CurrentGuestSession() guestSession: GuestSessionContext,
    @Query() query: MediaUrlQueryDto,
  ) {
    return this.galleryService.getMediaUrl(
      slug,
      mediaId,
      guestSession,
      query.variant ?? "web",
    );
  }

  @Delete("media/:mediaId")
  deleteMedia(
    @Param("slug") slug: string,
    @Param("mediaId") mediaId: string,
    @CurrentGuestSession() guestSession: GuestSessionContext,
  ) {
    return this.galleryService.deleteGuestMedia(slug, mediaId, guestSession);
  }
}
