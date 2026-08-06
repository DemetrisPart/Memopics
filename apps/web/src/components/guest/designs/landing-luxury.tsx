"use client";

import { Camera, ChevronRight, Images, MapPin } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Luxury venue — full-bleed hero, sticky action bar, refined hierarchy */
export function LandingLuxury({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-luxury min-h-dvh">
      <section className="design-luxury-hero">
        <EventHeroCover
          coverImageUrl={event.coverImageUrl}
          coverImageUrlLan={event.coverImageUrlLan}
          coverImageUrlPublic={event.coverImageUrlPublic}
        />
        <div className="design-luxury-scrim" aria-hidden />

        <div className="design-luxury-hero-copy">
          <p className="design-luxury-eyebrow">Wedding celebration</p>
          <CoupleNamesHeading
            groomName={event.groomName}
            brideName={event.brideName}
            fallback={event.title}
            className="design-luxury-names font-couple text-[2.5rem] leading-[1.02] sm:text-[3.25rem]"
          />
          <div className="design-luxury-meta">
            <span className="design-luxury-meta-item">
              <MapPin className="size-3.5" aria-hidden />
              {formatEventDate(event.eventDate)}
            </span>
          </div>
        </div>
      </section>

      <section className="design-luxury-body">
        <GuestAccessLabel variant="light" className="mb-6" />
        <p className="design-luxury-lead">
          Share your perspective from the day. Every moment you capture becomes part of the
          couple&apos;s album.
        </p>
        <LandingFooter privacyMode={event.privacyMode} className="design-luxury-footer" />
      </section>

      <div className="design-luxury-sticky">
        <button type="button" className="design-luxury-sticky-primary" onClick={onUpload}>
          <Camera className="size-5" aria-hidden />
          Upload photos
        </button>
        <button type="button" className="design-luxury-sticky-secondary" onClick={onGallery}>
          <Images className="size-5" aria-hidden />
          Gallery
          <ChevronRight className="size-4 opacity-50" aria-hidden />
        </button>
      </div>
    </div>
  );
}
