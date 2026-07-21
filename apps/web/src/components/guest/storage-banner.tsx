import { AlertTriangle } from "lucide-react";
import { storageRemainingLabel } from "@/lib/utils";

type StorageBannerProps = {
  storageUsedPercent: number;
  storageUsedBytes: string;
  storageLimitBytes: string;
};

export function StorageBanner({
  storageUsedPercent,
  storageUsedBytes,
  storageLimitBytes,
}: StorageBannerProps) {
  if (storageUsedPercent < 80) {
    return null;
  }

  const isFull = storageUsedPercent >= 100;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
        isFull
          ? "bg-rose-500/10 text-charcoal-900"
          : "bg-amber-500/10 text-charcoal-900"
      }`}
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
      <div>
        {isFull ? (
          <p className="font-medium">The gallery is full. The hosts have been notified.</p>
        ) : (
          <p className="font-medium">
            Gallery almost full — {storageRemainingLabel(storageUsedBytes, storageLimitBytes)}
          </p>
        )}
      </div>
    </div>
  );
}
