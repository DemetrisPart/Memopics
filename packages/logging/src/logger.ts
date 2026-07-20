import { randomUUID } from "node:crypto";
import pino, { type Logger as PinoLogger } from "pino";
import { LOG_CATEGORIES, type LogCategory } from "@memopics/shared";

export type AppLogger = PinoLogger;

export interface LoggerContext {
  requestId?: string;
  eventId?: string;
  userId?: string;
  uploadSessionId?: string;
  mediaId?: string;
  jobId?: string;
}

function baseLogger(): PinoLogger {
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: process.env.SERVICE_NAME ?? "memopics" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
}

let rootLogger: PinoLogger | undefined;

export function getLogger(): PinoLogger {
  if (!rootLogger) {
    rootLogger = baseLogger();
  }
  return rootLogger;
}

export function createChildLogger(
  category: LogCategory,
  context: LoggerContext = {},
): PinoLogger {
  return getLogger().child({ category, ...context });
}

/** Structured metric hook — consumed by log aggregators in production. */
export function logMetric(
  metric: string,
  data: Record<string, unknown> = {},
): void {
  createChildLogger(LOG_CATEGORIES.METRICS).info(
    { metric, ...data },
    "metric",
  );
}

export function logUploadInit(data: {
  eventId: string;
  guestSessionId: string;
  uploadSessionId: string;
  fileCount: number;
}): void {
  logMetric("upload.init", data);
  createChildLogger(LOG_CATEGORIES.UPLOAD, {
    eventId: data.eventId,
    uploadSessionId: data.uploadSessionId,
  }).info({ fileCount: data.fileCount, guestSessionId: data.guestSessionId }, "Upload init");
}

export function logUploadComplete(data: {
  eventId: string;
  guestSessionId: string;
  batchId: string;
  queuedCount: number;
  failedCount: number;
}): void {
  logMetric("upload.complete", data);
  createChildLogger(LOG_CATEGORIES.UPLOAD, { eventId: data.eventId }).info(
    {
      batchId: data.batchId,
      queuedCount: data.queuedCount,
      failedCount: data.failedCount,
      guestSessionId: data.guestSessionId,
    },
    "Upload complete",
  );
}

export function logUploadFailed(data: {
  eventId: string;
  batchId: string;
  reason: string;
}): void {
  logMetric("upload.failed", data);
}

export function logQueueMetrics(data: {
  waiting: number;
  active: number;
  failed: number;
  delayed?: number;
}): void {
  logMetric("queue.media", data);
}

export function logSlowRequest(data: {
  method: string;
  path: string;
  durationMs: number;
  requestId: string;
}): void {
  logMetric("api.slow_request", data);
  createChildLogger(LOG_CATEGORIES.REQUEST, {
    requestId: data.requestId,
  }).warn(data, "Slow HTTP request");
}

export function logStorageUsage(data: {
  eventId: string;
  storageUsedBytes: string;
  storageLimitBytes: string;
  storageUsedPercent: number;
}): void {
  logMetric("storage.usage", data);
}

/** HTTP request logging helper */
export function logRequest(data: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  requestId: string;
}): void {
  createChildLogger(LOG_CATEGORIES.REQUEST, {
    requestId: data.requestId,
  }).info(
    {
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      durationMs: data.durationMs,
    },
    "HTTP request",
  );
}

/** Upload pipeline error logging */
export function logUploadError(
  data: {
    eventId: string;
    uploadSessionId?: string;
    fileName?: string;
    errorCode: string;
    message: string;
    err?: unknown;
  },
): void {
  createChildLogger(LOG_CATEGORIES.UPLOAD, {
    eventId: data.eventId,
    uploadSessionId: data.uploadSessionId,
  }).error(
    {
      fileName: data.fileName,
      errorCode: data.errorCode,
      err: data.err,
    },
    data.message,
  );
}

/** Background worker error logging */
export function logWorkerError(
  data: {
    jobId: string;
    queue: string;
    mediaId?: string;
    message: string;
    err?: unknown;
  },
): void {
  createChildLogger(LOG_CATEGORIES.WORKER, {
    jobId: data.jobId,
    mediaId: data.mediaId,
  }).error(
    {
      queue: data.queue,
      err: data.err,
    },
    data.message,
  );
}

export function generateRequestId(): string {
  return randomUUID();
}
