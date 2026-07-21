"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const SNAP_MS = 165;
const SNAP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

async function resolveWebUrl(slug: string, item: LightboxItem) {
  try {
    const result = await fetchMediaUrl(slug, item.id, "web");
    return result.url;
  } catch {
    return item.thumbUrl;
  }
}

export function Lightbox({
  slug,
  items,
  initialIndex,
  onClose,
  onDelete,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [swipeHint, setSwipeHint] = useState(false);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

  const widthRef = useRef(0);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastSampleRef = useRef({ x: 0, t: 0 });
  const indexRef = useRef(index);

  const current = items[index];
  const canDelete = Boolean(current?.canDelete && onDelete);
  const canSwipe = items.length > 1;

  indexRef.current = index;

  const applyTransforms = useCallback((dx: number, animate: boolean) => {
    const w = widthRef.current;
    const transition = animate ? `transform ${SNAP_MS}ms ${SNAP_EASE}` : "none";
    const rot = dx * 0.012;

    const layers: Array<{ el: HTMLDivElement | null; offset: number; z: string }> =
      [
        { el: prevRef.current, offset: -w + dx, z: "0" },
        { el: nextRef.current, offset: w + dx, z: "0" },
        { el: currentRef.current, offset: dx, z: "1" },
      ];

    for (const layer of layers) {
      if (!layer.el) continue;
      layer.el.style.transition = transition;
      layer.el.style.zIndex = layer.z;
      layer.el.style.transform =
        layer.el === currentRef.current
          ? `translate3d(${layer.offset}px, 0, 0) rotate(${rot}deg)`
          : `translate3d(${layer.offset}px, 0, 0) scale(0.97)`;
    }
  }, []);

  const measureWidth = useCallback(() => {
    const w = viewportRef.current?.clientWidth ?? 0;
    if (w > 0) {
      widthRef.current = w;
      applyTransforms(dragXRef.current, false);
    }
  }, [applyTransforms]);

  const loadSlideUrls = useCallback(async () => {
    const item = items[index];
    if (!item) return;

    setLoading(true);
    const prevItem = items[index - 1];
    const nextItem = items[index + 1];

    const [currentResolved, prevResolved, nextResolved] = await Promise.all([
      resolveWebUrl(slug, item),
      prevItem ? resolveWebUrl(slug, prevItem) : Promise.resolve(null),
      nextItem ? resolveWebUrl(slug, nextItem) : Promise.resolve(null),
    ]);

    setWebUrl(currentResolved);
    setPrevUrl(prevResolved);
    setNextUrl(nextResolved);
    setLoading(false);
  }, [index, items, slug]);

  useEffect(() => {
    void loadSlideUrls();
  }, [loadSlideUrls]);

  useEffect(() => {
    if (items.length === 0) {
      onClose();
      return;
    }
    setIndex((i) => Math.min(i, items.length - 1));
  }, [items.length, onClose]);

  useEffect(() => {
    measureWidth();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => measureWidth());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measureWidth]);

  useEffect(() => {
    dragXRef.current = 0;
    applyTransforms(0, false);
  }, [index, applyTransforms]);

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
    const idx = indexRef.current;
    if (idx === 0 && delta > 0) return delta * 0.18;
    if (idx === items.length - 1 && delta < 0) return delta * 0.18;
    return delta;
  }

  function beginDrag(clientX: number) {
    if (!canSwipe || loading || deleting) return;

    setSwipeHint(false);
    draggingRef.current = true;
    setDragging(true);
    startXRef.current = clientX;
    lastSampleRef.current = { x: clientX, t: performance.now() };
    velocityRef.current = 0;
    applyTransforms(dragXRef.current, false);
  }

  function moveDrag(clientX: number) {
    if (!draggingRef.current) return;

    const now = performance.now();
    const elapsed = now - lastSampleRef.current.t;
    if (elapsed > 0) {
      velocityRef.current = (clientX - lastSampleRef.current.x) / elapsed;
    }
    lastSampleRef.current = { x: clientX, t: now };

    const delta = applyEdgeResistance(clientX - startXRef.current);
    dragXRef.current = delta;
    applyTransforms(delta, false);
  }

  function finishDrag() {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setDragging(false);

    const dx = dragXRef.current;
    const w = widthRef.current || 1;
    const v = velocityRef.current;
    const idx = indexRef.current;

    const commitNext =
      (dx < -w * 0.14 || v < -0.55) && idx < items.length - 1;
    const commitPrev = (dx > w * 0.14 || v > 0.55) && idx > 0;

    const settle = (targetDx: number, nextIndex: number) => {
      applyTransforms(targetDx, true);

      const layer = currentRef.current;
      if (!layer) return;

      const onDone = () => {
        layer.removeEventListener("transitionend", onDone);
        dragXRef.current = 0;
        setIndex(nextIndex);
        applyTransforms(0, false);
      };

      layer.addEventListener("transitionend", onDone);
    };

    if (commitNext) {
      settle(-w, idx + 1);
      return;
    }

    if (commitPrev) {
      settle(w, idx - 1);
      return;
    }

    applyTransforms(0, true);
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
        className="relative flex flex-1 touch-none select-none items-center justify-center px-4"
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
          ref={viewportRef}
          className={cn(
            "relative h-full max-h-[75vh] w-full max-w-3xl overflow-hidden",
            swipeHint && !dragging && "lightbox-swipe-hint",
          )}
        >
          {prevUrl && index > 0 ? (
            <div ref={prevRef} className="absolute inset-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prevUrl}
                alt=""
                className="pointer-events-none size-full object-contain select-none"
                draggable={false}
              />
            </div>
          ) : null}

          {nextUrl && index < items.length - 1 ? (
            <div ref={nextRef} className="absolute inset-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nextUrl}
                alt=""
                className="pointer-events-none size-full object-contain select-none"
                draggable={false}
              />
            </div>
          ) : null}

          <div
            ref={currentRef}
            className="absolute inset-0 z-[1] will-change-transform"
          >
            {loading || !webUrl ? (
              <div className="flex h-full min-h-[40vh] items-center justify-center text-ivory-50">
                {deleting ? "Deleting…" : "Loading…"}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webUrl}
                alt=""
                className="pointer-events-none size-full object-contain select-none"
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
