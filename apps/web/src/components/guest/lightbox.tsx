"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { fetchMediaUrl } from "@/lib/api/client";

type LightboxProps = {
  slug: string;
  items: { id: string; thumbUrl: string | null }[];
  initialIndex: number;
  onClose: () => void;
};

export function Lightbox({ slug, items, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);

  const current = items[index];

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
              Loading…
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
    </div>
  );
}
