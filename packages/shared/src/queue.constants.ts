/** BullMQ queue names — shared between API (producer) and worker-media (consumer). */
export const MEDIA_QUEUE_NAME = "media" as const;

/** Job name for Sharp image variant generation. */
export const MEDIA_PROCESS_IMAGE_JOB = "process-image" as const;

export type MediaQueueName = typeof MEDIA_QUEUE_NAME;
