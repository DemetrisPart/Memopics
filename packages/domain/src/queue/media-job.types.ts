/** Payload enqueued after a guest upload batch is completed and verified. */
export interface MediaProcessImageJobPayload {
  mediaAssetId: string;
  eventId: string;
}
