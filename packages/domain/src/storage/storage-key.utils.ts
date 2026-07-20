/** Validates object storage keys are scoped to a single event. */
export function buildEventStoragePrefix(appEnv: string, eventId: string): string {
  return `${appEnv}/events/${eventId}/`;
}

export function isMediaOriginalKeyForEvent(
  key: string,
  appEnv: string,
  eventId: string,
): boolean {
  const prefix = `${appEnv}/events/${eventId}/originals/`;
  return key.startsWith(prefix) && !key.includes("..");
}

export function isMediaVariantKeyForEvent(
  key: string,
  appEnv: string,
  eventId: string,
): boolean {
  const prefix = `${appEnv}/events/${eventId}/images/`;
  return key.startsWith(prefix) && !key.includes("..");
}
