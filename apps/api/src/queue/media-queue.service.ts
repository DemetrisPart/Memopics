import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MediaProcessImageJobPayload } from "@memopics/domain";
import { logQueueMetrics, logWorkerError } from "@memopics/logging";
import {
  MEDIA_PROCESS_IMAGE_JOB,
  MEDIA_QUEUE_NAME,
} from "@memopics/shared";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface MediaQueueCounts {
  waiting: number;
  active: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class MediaQueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queue: Queue<MediaProcessImageJobPayload>;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.getOrThrow<string>("REDIS_URL");
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<MediaProcessImageJobPayload>(MEDIA_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: this.config.get<number>("MEDIA_QUEUE_JOB_ATTEMPTS", 3),
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }

  async enqueueImageProcessing(
    payload: MediaProcessImageJobPayload,
  ): Promise<void> {
    const jobId = payload.mediaAssetId;

    try {
      const existing = await this.queue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (state === "completed" || state === "active" || state === "waiting") {
          return;
        }
        if (state === "failed") {
          await existing.remove();
        }
      }

      await this.queue.add(MEDIA_PROCESS_IMAGE_JOB, payload, { jobId });
    } catch (err) {
      logWorkerError({
        jobId,
        queue: MEDIA_QUEUE_NAME,
        mediaId: payload.mediaAssetId,
        message: "Failed to enqueue media processing job",
        err,
      });
      throw err;
    }
  }

  async getCounts(): Promise<MediaQueueCounts> {
    const counts = await this.queue.getJobCounts(
      "waiting",
      "active",
      "failed",
      "delayed",
    );

    const snapshot: MediaQueueCounts = {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
    };

    logQueueMetrics(snapshot);
    return snapshot;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}
