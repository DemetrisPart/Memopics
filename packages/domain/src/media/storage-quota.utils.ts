export interface StorageQuotaInput {
  storageUsedBytes: bigint;
  storageLimitBytes: bigint;
  incomingBytes: bigint;
}

export interface StorageQuotaResult {
  allowed: boolean;
  remainingBytes: bigint;
  wouldExceedBy?: bigint;
}

export function checkStorageQuota(input: StorageQuotaInput): StorageQuotaResult {
  const remainingBytes = input.storageLimitBytes - input.storageUsedBytes;
  const projected = input.storageUsedBytes + input.incomingBytes;

  if (projected <= input.storageLimitBytes) {
    return { allowed: true, remainingBytes };
  }

  return {
    allowed: false,
    remainingBytes,
    wouldExceedBy: projected - input.storageLimitBytes,
  };
}
