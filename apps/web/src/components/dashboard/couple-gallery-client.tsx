"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { SquareThumbFrame } from "@/components/guest/square-thumb-frame";
import {
  deleteCoupleMedia,
  fetchCoupleGallery,
  fetchCoupleMediaUrl,
} from "@/lib/api/dashboard-client";
import { resolveNetworkUrl } from "@/lib/mobile-network";
import type { CoupleGalleryItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type CoupleGalleryClientProps = {
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

export function CoupleGalleryClient({ eventId }: CoupleGalleryClientProps) {
  const [items, setItems] = useState<CoupleGalleryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadGallery = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await fetchCoupleGallery(eventId, { cursor, limit: 24 });
        setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setTotalCount(data.totalCount);
        setNextCursor(data.nextCursor);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load gallery",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nextCursor || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadGallery(nextCursor);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, loadGallery]);

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeletingId(mediaId);
    try {
      await deleteCoupleMedia(eventId, mediaId);
      setItems((prev) => prev.filter((item) => item.id !== mediaId));
      setTotalCount((c) => Math.max(0, c - 1));
      setLightboxIndex(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {loading ? "Loading…" : `${totalCount} photos`}
        </p>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm font-medium text-gold-700 hover:underline lg:hidden"
        >
          ← Overview
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-stone-200/60"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
          <p className="text-sm text-stone-400">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item, index) => {
            const url = thumbUrl(item);
            return (
              <SquareThumbFrame
                key={item.id}
                className="rounded-lg bg-ivory-100"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-stone-400">
                    …
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="absolute inset-0"
                  aria-label="View photo"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-charcoal-900/60 px-1 py-0.5 text-[10px] text-ivory-50">
                  {item.guestName}
                </span>
              </SquareThumbFrame>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" aria-hidden />
      {loadingMore ? (
        <p className="text-center text-sm text-stone-400">Loading more…</p>
      ) : null}

      {lightboxIndex !== null ? (
        <CoupleLightbox
          eventId={eventId}
          items={items}
          initialIndex={lightboxIndex}
          deleting={deletingId !== null}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDelete}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}

type CoupleLightboxProps = {
  eventId: string;
  items: CoupleGalleryItem[];
  initialIndex: number;
  deleting: boolean;
  onClose: () => void;
  onDelete: (mediaId: string) => Promise<void>;
  onIndexChange: (index: number) => void;
};

function CoupleLightbox({
  eventId,
  items,
  initialIndex,
  deleting,
  onClose,
  onDelete,
  onIndexChange,
}: CoupleLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const item = items[index];

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    void fetchCoupleMediaUrl(eventId, item.id, "web")
      .then((result) => {
        setUrl(
          resolveNetworkUrl({
            url: result.url,
            lanUrl: result.urlLan,
            publicUrl: result.urlPublic,
          }),
        );
      })
      .catch(() => {
        setUrl(thumbUrl(item));
      })
      .finally(() => setLoading(false));
  }, [eventId, item]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    setIndex(clamped);
    onIndexChange(clamped);
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal
      aria-label="Photo viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="truncate text-sm">{item.guestName}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            disabled={deleting}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
            aria-label="Delete photo"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="absolute left-2 z-10 rounded-full bg-white/10 px-3 py-2 text-white disabled:opacity-30"
          aria-label="Previous"
        >
          ‹
        </button>
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-[70dvh] max-w-full object-contain"
          />
        ) : null}
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index >= items.length - 1}
          className="absolute right-2 z-10 rounded-full bg-white/10 px-3 py-2 text-white disabled:opacity-30"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <p className={cn("pb-6 text-center text-xs text-white/50")}>
        {index + 1} / {items.length}
      </p>
    </div>
  );
}
