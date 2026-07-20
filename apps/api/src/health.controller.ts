import { Controller, Get } from "@nestjs/common";
import { MediaQueueService } from "./queue/media-queue.service";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaQueue: MediaQueueService,
  ) {}

  @Get()
  async check(): Promise<{
    status: string;
    service: string;
    database: string;
    queue?: {
      waiting: number;
      active: number;
      failed: number;
      delayed: number;
    };
  }> {
    let database: "ok" | "error" = "error";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "error";
    }

    let queue:
      | {
          waiting: number;
          active: number;
          failed: number;
          delayed: number;
        }
      | undefined;

    try {
      queue = await this.mediaQueue.getCounts();
    } catch {
      queue = undefined;
    }

    const queueHealthy = !queue || queue.failed < 1000;

    return {
      status: database === "ok" && queueHealthy ? "ok" : "degraded",
      service: "memopics-api",
      database,
      queue,
    };
  }
}
