import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventStatus } from "@memopics/database";
import type { JwtPayload } from "@memopics/domain";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedRequest } from "../../auth/auth.guard";

export type EventOwnerRequest = AuthenticatedRequest & {
  event: {
    id: string;
    ownerUserId: string;
    slug: string;
    status: EventStatus;
  };
};

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException("Authentication required");
    }

    const eventId = request.params.id as string | undefined;
    if (!eventId) {
      throw new NotFoundException("Event not found");
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        ownerUserId: user.sub,
        deletedAt: null,
        status: { not: EventStatus.DELETED },
      },
      select: {
        id: true,
        ownerUserId: true,
        slug: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    (request as EventOwnerRequest).event = event;
    return true;
  }
}
