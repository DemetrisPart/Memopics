"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, X } from "lucide-react";
import { fetchMediaUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type LightboxItem = {
  id: string;
  thumbUrl: string | null;
  canDelete?: boolean;
};

type LightboxProps = {
  slug: string;
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (mediaId: string) => Promise<void>;
};

const SWIPE_THRESHOLD_PX = 60;

export function Lightbox({
  slug,
  items,
  initialIndex,
  onClose,
  onDelete,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [swipeHint, setSwipeHint] = useState(false);
  const swipeStartX = useRef<number | null>(null);

  const current = items[index];
  const canDelete = Boolean(current?.canDelete && onDelete);
  const canSwipe = items.length > 1;

  const loadWebUrl = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setWebUrl(null);
    try {
      const result = await fetchMediaUrl(slug, current.id, "web");
      setWebUrl(result.url);
    } catch {
      setWebUrl(current.thumbUrl);
    } finally {
      setLoading(false);
    }
  }, [current, slug]);

  useEffect(() => {
    void loadWebUrl();
  }, [loadWebUrl]);

  useEffect(() => {
    if (items.length === 0) {
      onClose();
      return;
    }
    setIndex((i) => Math.min(i, items.length - 1));
  }, [items.length, onClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!canSwipe || loading || !webUrl) return;

    setSwipeHint(true);
    const timer = window.setTimeout(() => setSwipeHint(false), 700);
    return () => window.clearTimeout(timer);
  }, [canSwipe, index, loading, webUrl]);

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(items.length - 1, i + 1));
  }

  function handleSwipeEnd(endX: number) {
    const start = swipeStartX.current;
    swipeStartX.current = null;
    if (start == null) return;

    const delta = endX - start;
    if (delta > SWIPE_THRESHOLD_PX) goPrev();
    if (delta < -SWIPE_THRESHOLD_PX) goNext();
  }

  async function handleDelete() {
    if (!current || !onDelete || deleting) return;

    const confirmed = window.confirm(
      "Delete this photo? It will be removed from the gallery.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(current.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-charcoal-900">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-ivory-50">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ivory-50 hover:bg-white/10"
          aria-label="Close lightbox"
        >
          <X className="size-6" />
        </button>
      </div>

      <div
        className="relative flex flex-1 touch-pan-y items-center justify-center px-4"
        onTouchStart={(e) => {
          swipeStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          handleSwipeEnd(e.changedTouches[0]?.clientX ?? 0);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") {
            swipeStartX.current = e.clientX;
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") {
            handleSwipeEnd(e.clientX);
          }
        }}
      >
        <div
          className={cn(
            "relative h-full max-h-[75vh] w-full max-w-3xl",
            swipeHint && "lightbox-swipe-hint",
          )}
        >
          {loading || !webUrl ? (
            <div className="flex h-full min-h-[40vh] items-center justify-center text-ivory-50">
              {deleting ? "Deleting…" : "Loading…"}
            </div>
          ) : (
            <Image
              src={webUrl}
              alt=""
              fill
              className="pointer-events-none object-contain select-none"
              sizes="100vw"
              unoptimized
              draggable={false}
            />
          )}
        </div>
      </div>

      {canDelete ? (
        <div className="flex justify-center border-t border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-base font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="size-5 shrink-0" aria-hidden />
            {deleting ? "Deleting…" : "Delete photo"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
