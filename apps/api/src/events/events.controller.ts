import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { JwtPayload } from "@memopics/domain";
import { CurrentUser, JwtAuthGuard } from "../auth/auth.guard";
import {
  CoverUploadCompleteDto,
  CoverUploadInitDto,
  CreateEventDto,
  UpdateEventDto,
} from "./dto/event.dto";
import { EventOwnerGuard } from "./guards/event-owner.guard";
import { EventsService } from "./events.service";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.eventsService.listEvents(user.sub);
  }

  @Get("check-slug/:slug")
  checkSlug(@Param("slug") slug: string) {
    return this.eventsService.checkSlugAvailability(slug);
  }

  @Get(":id/stats")
  @UseGuards(EventOwnerGuard)
  stats(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.eventsService.getEventStats(id, user.sub);
  }

  @Get(":id/qr/download")
  @UseGuards(EventOwnerGuard)
  async qrDownload(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const [buffer, event] = await Promise.all([
      this.eventsService.getQrPngBuffer(id, user.sub),
      this.eventsService.getEventById(id, user.sub),
    ]);
    return new StreamableFile(buffer, {
      type: "image/png",
      disposition: `attachment; filename="${event.slug}-qr.png"`,
    });
  }

  @Get(":id/qr")
  @UseGuards(EventOwnerGuard)
  qr(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.eventsService.getQrPayload(id, user.sub);
  }

  @Post(":id/cover/init")
  @UseGuards(EventOwnerGuard)
  initCover(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CoverUploadInitDto,
  ) {
    return this.eventsService.initCoverUpload(id, user.sub, dto);
  }

  @Post(":id/cover/complete")
  @UseGuards(EventOwnerGuard)
  completeCover(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CoverUploadCompleteDto,
  ) {
    return this.eventsService.completeCoverUpload(id, user.sub, dto.mediaId);
  }

  @Get(":id")
  @UseGuards(EventOwnerGuard)
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.eventsService.getEventById(id, user.sub);
  }

  @Patch(":id")
  @UseGuards(EventOwnerGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, user.sub, dto);
  }
}
