"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lightbox } from "@/components/guest/lightbox";
import { NameEntryModal } from "@/components/guest/name-entry-modal";
import { checkGuestSession, fetchGallery } from "@/lib/api/client";
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
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="relative aspect-square overflow-hidden rounded-lg bg-ivory-100"
                >
                  {galleryThumbUrl(item) ? (
                    <Image
                      src={galleryThumbUrl(item)!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="33vw"
                      loading="lazy"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-stone-400">
                      …
                    </div>
                  )}
                  {item.guestLabel ? (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-charcoal-900/60 px-1 py-0.5 text-[10px] text-ivory-50">
                      {item.guestLabel}
                    </span>
                  ) : null}
                </button>
              ))}
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

      <div className="fixed inset-x-0 bottom-0 border-t border-charcoal-800/10 bg-ivory-50/95 p-4 backdrop-blur">
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
        />
      ) : null}
    </div>
  );
}
