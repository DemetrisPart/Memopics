"use client";

import Image from "next/image";
import { Camera, Images, Users } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { resolveNetworkUrl } from "@/lib/mobile-network";
import { formatEventDate } from "@/lib/utils";

const TILE_POSITIONS = [
  "object-center",
  "object-[center_20%]",
  "object-[center_80%]",
  "object-[30%_center]",
  "object-[70%_center]",
  "object-[center_40%]",
] as const;

/** Shared album — realistic photo grid, storage bar, app-style header */
export function LandingAlbum({ event, onUpload, onGallery }: LandingDesignProps) {
  const coverSrc = event.coverImageUrl
    ? resolveNetworkUrl({
        url: event.coverImageUrl,
        lanUrl: event.coverImageUrlLan,
        publicUrl: event.coverImageUrlPublic,
      })
    : null;

  const usedPercent = Math.min(100, Math.max(0, event.storageUsedPercent ?? 0));

  return (
    <div className="design-album min-h-dvh">
      <header className="design-album-header">
        <div>
          <p className="design-album-label">Shared album</p>
          <CoupleNamesHeading
            groomName={event.groomName}
            brideName={event.brideName}
            fallback={event.title}
            className="design-album-title font-couple text-[1.375rem] leading-tight"
          />
          <p className="design-album-date">{formatEventDate(event.eventDate)}</p>
        </div>
        <div className="design-album-avatars" aria-hidden>
          <span>D</span>
          <span>D</span>
          <span>+</span>
        </div>
      </header>

      <div className="design-album-stats">
        <div className="design-album-stat">
          <Users className="size-4" aria-hidden />
          <span>Guest uploads</span>
        </div>
        <div className="design-album-storage">
          <div className="design-album-storage-track">
            <div className="design-album-storage-fill" style={{ width: `${Math.max(usedPercent, 4)}%` }} />
          </div>
          <span className="design-album-storage-label">{usedPercent}% album capacity</span>
        </div>
      </div>

      <div className="design-album-grid">
        {TILE_POSITIONS.map((position, i) => (
          <div key={i} className={`design-album-cell ${i === 0 ? "design-album-cell-hero" : ""}`}>
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt=""
                fill
                className={`object-cover ${position}`}
                sizes={i === 0 ? "100vw" : "33vw"}
                unoptimized
              />
            ) : (
              <div className="design-album-placeholder" />
            )}
            {i === 5 ? (
              <button type="button" className="design-album-more" onClick={onGallery}>
                View all
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <section className="design-album-panel">
        <GuestAccessLabel variant="light" className="mb-4 !justify-start" />
        <div className="design-album-actions">
          <button type="button" className="design-album-upload" onClick={onUpload}>
            <Camera className="size-5" aria-hidden />
            Add your photos
          </button>
          <button type="button" className="design-album-gallery" onClick={onGallery}>
            <Images className="size-5" aria-hidden />
            Browse gallery
          </button>
        </div>
        <LandingFooter privacyMode={event.privacyMode} className="design-album-footer mt-6" />
      </section>
    </div>
  );
}
