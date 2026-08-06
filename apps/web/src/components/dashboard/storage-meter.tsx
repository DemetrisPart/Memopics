import { formatBytes, storageRemainingLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StorageMeterProps = {
  usedBytes: string;
  limitBytes: string;
  usedPercent: number;
  className?: string;
};

export function StorageMeter({
  usedBytes,
  limitBytes,
  usedPercent,
  className,
}: StorageMeterProps) {
  const clamped = Math.min(100, Math.max(0, usedPercent));
  const warn = clamped >= 80;

  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-400">Storage</p>
          <p className="mt-1 text-2xl font-semibold text-charcoal-900">
            {clamped}%
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {formatBytes(usedBytes)} of {formatBytes(limitBytes)} used
          </p>
        </div>
        <p className="text-right text-sm text-stone-400">
          {storageRemainingLabel(usedBytes, limitBytes)}
        </p>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-ivory-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage used"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            warn ? "bg-amber-500" : "bg-gold-600",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
