import { Controller, Get, Param } from "@nestjs/common";
import { EventsService } from "./events.service";

@Controller("public/events")
export class PublicEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(":slug/qr")
  getQr(@Param("slug") slug: string) {
    return this.eventsService.getPublicEventQr(slug);
  }

  @Get(":slug")
  getBySlug(@Param("slug") slug: string) {
    return this.eventsService.getPublicEventBySlug(slug);
  }
}
