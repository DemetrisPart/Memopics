"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { fetchMediaUrl } from "@/lib/api/client";

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
  const touchStartX = useRef<number | null>(null);

  const current = items[index];
  const canDelete = Boolean(current?.canDelete && onDelete);

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
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight")
        setIndex((i) => Math.min(items.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items.length, onClose]);

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(items.length - 1, i + 1));
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
        className="relative flex flex-1 items-center justify-center px-4"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null) return;
          const delta = end - start;
          if (delta > 60) goPrev();
          if (delta < -60) goNext();
        }}
      >
        {index > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-ivory-50"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}

        <div className="relative h-full max-h-[75vh] w-full max-w-3xl">
          {loading || !webUrl ? (
            <div className="flex h-full min-h-[40vh] items-center justify-center text-ivory-50">
              {deleting ? "Deleting…" : "Loading…"}
            </div>
          ) : (
            <Image
              src={webUrl}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          )}
        </div>

        {index < items.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-ivory-50"
            aria-label="Next photo"
          >
            <ChevronRight className="size-6" />
          </button>
        ) : null}
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
