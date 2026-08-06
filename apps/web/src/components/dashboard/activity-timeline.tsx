import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { CoupleGalleryItem } from "@/lib/api/types";
import { resolveNetworkUrl } from "@/lib/mobile-network";

type ActivityTimelineProps = {
  items: CoupleGalleryItem[];
  eventId: string;
};

function thumbUrl(item: CoupleGalleryItem): string | null {
  if (!item.thumbUrl) return null;
  return resolveNetworkUrl({
    url: item.thumbUrl,
    lanUrl: item.thumbUrlLan,
    publicUrl: item.thumbUrlPublic,
  });
}

export function ActivityTimeline({ items, eventId }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-center">
        <p className="text-sm text-stone-400">No uploads yet</p>
        <p className="mt-1 text-xs text-stone-400">
          Share your QR code so guests can start uploading.
        </p>
        <Link
          href={`/dashboard/events/${eventId}/qr`}
          className="mt-4 inline-block text-sm font-medium text-gold-700 hover:underline"
        >
          View QR code →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-soft">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-charcoal-900">
          Recent uploads
        </h2>
      </div>
      <ul className="divide-y divide-stone-200">
        {items.map((item) => {
          const url = thumbUrl(item);
          return (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ivory-100">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-charcoal-900">
                  {item.guestName}
                </p>
                <p className="text-xs text-stone-400">Photo uploaded</p>
              </div>
              <time
                className="shrink-0 text-xs text-stone-400"
                dateTime={item.createdAt}
              >
                {formatRelativeTime(item.createdAt)}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
