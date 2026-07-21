"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Lightbox } from "@/components/guest/lightbox";
import { NameEntryModal } from "@/components/guest/name-entry-modal";
import {
  checkGuestSession,
  deleteGalleryMedia,
  fetchGallery,
} from "@/lib/api/client";
import { resolveNetworkUrl } from "@/lib/mobile-network";
import type { GalleryItem, PrivacyMode, PublicEvent } from "@/lib/api/types";

type GalleryPageClientProps = {
  slug: string;
  event: PublicEvent;
};

function galleryThumbUrl(item: GalleryItem): string | null {
  if (!item.thumbUrl) return null;
  return resolveNetworkUrl({
    url: item.thumbUrl,
    lanUrl: item.thumbUrlLan,
    publicUrl: item.thumbUrlPublic,
  });
}

function galleryHeader(
  privacyMode: PrivacyMode,
  totalCount: number,
): string {
  if (privacyMode === "OWN_UPLOADS_ONLY") {
    return `Your uploads (${totalCount})`;
  }
  return `All guest uploads (${totalCount})`;
}

export function GalleryPageClient({ slug, event }: GalleryPageClientProps) {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(event.privacyMode);
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
        const data = await fetchGallery(slug, { cursor, limit: 24 });
        setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setTotalCount(data.totalCount);
        setPrivacyMode(data.privacyMode);
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
    [slug],
  );

  const handleDeleteMedia = useCallback(
    async (mediaId: string) => {
      setDeletingId(mediaId);
      try {
        await deleteGalleryMedia(slug, mediaId);
        setItems((prev) => {
          const next = prev.filter((item) => item.id !== mediaId);
          setLightboxIndex((current) => {
            if (current === null) return null;
            if (next.length === 0) return null;
            return Math.min(current, next.length - 1);
          });
          return next;
        });
        setTotalCount((count) => Math.max(0, count - 1));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not delete photo",
        );
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [slug],
  );

  async function handleGridDelete(
    event: React.MouseEvent,
    item: GalleryItem,
  ) {
    event.stopPropagation();
    if (!item.canDelete || deletingId) return;

    const confirmed = window.confirm(
      "Delete this photo? It will be removed from the gallery.",
    );
    if (!confirmed) return;

    await handleDeleteMedia(item.id);
  }

  useEffect(() => {
    async function verifySession() {
      setCheckingSession(true);
      const hasSession = await checkGuestSession(slug);
      if (!hasSession) {
        setNeedsName(true);
        setCheckingSession(false);
        return;
      }
      setNeedsName(false);
      setSessionReady(true);
      setCheckingSession(false);
      await loadGallery();
    }
    void verifySession();
  }, [loadGallery, slug]);

  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
          void loadGallery(nextCursor);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadGallery, loadingMore, nextCursor]);

  if (checkingSession) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  if (needsName) {
    return (
      <NameEntryModal
        slug={slug}
        open
        onClose={() => router.replace(`/${slug}`)}
        onSuccess={() => {
          setNeedsName(false);
          setSessionReady(true);
          void loadGallery();
        }}
      />
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-24">
      <header className="sticky top-0 z-10 border-b border-charcoal-800/10 bg-ivory-50/95 px-4 py-4 backdrop-blur">
        <Link
          href={`/${slug}`}
          className="text-sm text-stone-400 hover:text-charcoal-800"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-medium text-charcoal-900">Gallery</h1>
        <p className="mt-1 text-sm text-stone-400">
          {galleryHeader(privacyMode, totalCount)}
        </p>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-stone-400">
            Loading photos…
          </div>
        ) : error ? (
          <p className="text-center text-sm text-rose-500" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-stone-400">No photos yet.</p>
            <Link
              href={`/${slug}/upload`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold-600 px-6 text-base font-medium text-ivory-50 hover:bg-gold-700"
            >
              Upload Photos
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {items.map((item, index) => {
                const thumbUrl = galleryThumbUrl(item);
                return (
                  <div
                    key={item.id}
                    className="min-w-0 overflow-hidden rounded-lg bg-ivory-100"
                  >
                    {/* pt-[100%] keeps a real box height on iOS — absolute-only children collapse */}
                    <div className="relative w-full pt-[100%]">
                      <div className="absolute inset-0">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                            decoding="async"
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
                        {item.canDelete ? (
                          <button
                            type="button"
                            onClick={(event) =>
                              void handleGridDelete(event, item)
                            }
                            disabled={deletingId === item.id}
                            className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-charcoal-900/75 text-white disabled:opacity-50"
                            aria-label="Delete photo"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        ) : null}
                        {item.guestLabel ? (
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-charcoal-900/60 px-1 py-0.5 text-[10px] text-ivory-50">
                            {item.guestLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={sentinelRef} className="h-8" />
            {loadingMore ? (
              <p className="py-4 text-center text-sm text-stone-400">
                Loading more…
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-charcoal-800/10 bg-ivory-50/95 p-4 backdrop-blur">
        <Link
          href={`/${slug}/upload`}
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-gold-600 text-base font-medium text-ivory-50 hover:bg-gold-700"
        >
          Upload More
        </Link>
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          slug={slug}
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDeleteMedia}
        />
      ) : null}
    </div>
  );
}
