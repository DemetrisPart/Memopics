import "./load-env";
import { getLogger, logMetric, logWorkerError } from "@memopics/logging";
import { startMediaWorker } from "./media-processor";

const logger = getLogger().child({ service: "worker-media" });

async function main(): Promise<void> {
  const concurrency = process.env.WORKER_MEDIA_CONCURRENCY ?? "2";
  const worker = startMediaWorker();

  worker.on("ready", () => {
    logger.info(
      { concurrency: parseInt(concurrency, 10) },
      "Memopics media worker ready — consuming media queue",
    );
  });

  worker.on("completed", (job) => {
    logMetric("worker.job_completed", {
      jobId: job.id,
      mediaAssetId: job.data.mediaAssetId,
      eventId: job.data.eventId,
    });
    logger.info(
      { jobId: job.id, mediaId: job.data.mediaAssetId },
      "Media job completed",
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down media worker");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason: unknown) => {
    logWorkerError({
      jobId: "unhandled",
      queue: "media",
      message: "Unhandled rejection in worker-media",
      err: reason,
    });
  });
}

main().catch((err: unknown) => {
  logger.fatal({ err }, "Failed to start worker-media");
  process.exit(1);
});
