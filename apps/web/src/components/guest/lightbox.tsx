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

const SWIPE_COMMIT_PX = 72;
const SWIPE_EXIT_MS = 240;

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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

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
    setDragX(0);
    dragXRef.current = 0;
  }, [index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!canSwipe || loading || !webUrl || dragging) return;

    setSwipeHint(true);
    const timer = window.setTimeout(() => setSwipeHint(false), 1100);
    return () => window.clearTimeout(timer);
  }, [canSwipe, dragging, index, loading, webUrl]);

  function applyEdgeResistance(delta: number): number {
    if (index === 0 && delta > 0) return delta * 0.22;
    if (index === items.length - 1 && delta < 0) return delta * 0.22;
    return delta;
  }

  function beginDrag(clientX: number) {
    if (!canSwipe || loading || deleting) return;
    setSwipeHint(false);
    setDragging(true);
    startXRef.current = clientX;
    dragXRef.current = 0;
    setDragX(0);
  }

  function moveDrag(clientX: number) {
    if (!dragging) return;
    const delta = applyEdgeResistance(clientX - startXRef.current);
    dragXRef.current = delta;
    setDragX(delta);
  }

  function finishDrag() {
    if (!dragging) return;
    setDragging(false);

    const delta = dragXRef.current;
    const exitDistance =
      typeof window !== "undefined" ? window.innerWidth * 0.35 : 320;

    if (delta > SWIPE_COMMIT_PX && index > 0) {
      setDragX(exitDistance);
      window.setTimeout(() => {
        setIndex((i) => Math.max(0, i - 1));
        setDragX(0);
        dragXRef.current = 0;
      }, SWIPE_EXIT_MS);
      return;
    }

    if (delta < -SWIPE_COMMIT_PX && index < items.length - 1) {
      setDragX(-exitDistance);
      window.setTimeout(() => {
        setIndex((i) => Math.min(items.length - 1, i + 1));
        setDragX(0);
        dragXRef.current = 0;
      }, SWIPE_EXIT_MS);
      return;
    }

    setDragX(0);
    dragXRef.current = 0;
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

  const dragRotate = dragX * 0.025;
  const dragOpacity = 1 - Math.min(Math.abs(dragX) / 520, 0.12);

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
        ref={swipeAreaRef}
        className="relative flex flex-1 items-center justify-center px-4 touch-none select-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          swipeAreaRef.current?.setPointerCapture(e.pointerId);
          beginDrag(e.clientX);
        }}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={() => finishDrag()}
        onPointerCancel={() => finishDrag()}
      >
        <div
          className={cn(
            "relative h-full max-h-[75vh] w-full max-w-3xl",
            swipeHint && !dragging && dragX === 0 && "lightbox-swipe-hint",
          )}
        >
          <div
            className="relative size-full will-change-transform"
            style={{
              transform: `translate3d(${dragX}px, 0, 0) rotate(${dragRotate}deg)`,
              opacity: dragOpacity,
              transition: dragging
                ? "none"
                : `transform ${SWIPE_EXIT_MS}ms ease-out, opacity ${SWIPE_EXIT_MS}ms ease-out`,
            }}
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
