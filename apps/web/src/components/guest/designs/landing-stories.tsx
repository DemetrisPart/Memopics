"use client";

import { ChevronUp, Images } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Instagram Stories — full bleed, progress segments, tap upload / swipe gallery */
export function LandingStories({ event, onUpload, onGallery }: LandingDesignProps) {
  const initial = (event.groomName?.[0] ?? event.title[0] ?? "M").toUpperCase();

  return (
    <div className="design-stories min-h-dvh">
      <section className="design-stories-stage">
        <EventHeroCover
          coverImageUrl={event.coverImageUrl}
          coverImageUrlLan={event.coverImageUrlLan}
          coverImageUrlPublic={event.coverImageUrlPublic}
        />
        <div className="design-stories-overlay" aria-hidden />

        <div className="design-stories-chrome">
          <div className="design-stories-progress" aria-hidden>
            <span className="design-stories-progress-fill" />
            <span />
            <span />
          </div>

          <div className="design-stories-header">
            <div className="design-stories-avatar">{initial}</div>
            <div>
              <CoupleNamesHeading
                groomName={event.groomName}
                brideName={event.brideName}
                fallback={event.title}
                className="design-stories-names text-sm font-semibold"
              />
              <p className="design-stories-meta">{formatEventDate(event.eventDate)} · Live</p>
            </div>
          </div>
        </div>

        <button type="button" className="design-stories-tap-upload" onClick={onUpload}>
          <span className="design-stories-tap-pulse" aria-hidden />
          Tap to upload your photo
        </button>

        <button type="button" className="design-stories-tap-gallery" onClick={onGallery}>
          <ChevronUp className="size-4" aria-hidden />
          Swipe up for gallery
          <Images className="size-4 opacity-60" aria-hidden />
        </button>
      </section>

      <LandingFooter privacyMode={event.privacyMode} className="design-stories-footer" />
    </div>
  );
}
