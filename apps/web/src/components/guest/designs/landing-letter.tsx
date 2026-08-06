"use client";

import { useState } from "react";
import { Camera, Images } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Letter — envelope opens to reveal handwritten-style invite */
export function LandingLetter({ event, onUpload, onGallery }: LandingDesignProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="design-letter min-h-dvh">
      <main className="design-letter-stage">
        {!open ? (
          <button
            type="button"
            className="design-letter-envelope"
            onClick={() => setOpen(true)}
            aria-label="Open invitation"
          >
            <div className="design-letter-flap" aria-hidden />
            <div className="design-letter-body">
              <span className="design-letter-seal" aria-hidden />
              <p className="design-letter-tap">Tap to open</p>
              <p className="design-letter-to">You&apos;re invited</p>
            </div>
          </button>
        ) : (
          <article className="design-letter-paper">
            <p className="design-letter-dear">Dearest guest,</p>
            <p className="design-letter-intro">
              Join us in celebrating a day we&apos;ll never forget. Share your photos and
              become part of our story.
            </p>

            <div className="design-letter-photo">
              <EventHeroCover
                coverImageUrl={event.coverImageUrl}
                coverImageUrlLan={event.coverImageUrlLan}
                coverImageUrlPublic={event.coverImageUrlPublic}
              />
            </div>

            <CoupleNamesHeading
              groomName={event.groomName}
              brideName={event.brideName}
              fallback={event.title}
              className="design-letter-names font-couple text-[2rem] leading-[1.05]"
            />
            <p className="design-letter-date">{formatEventDate(event.eventDate)}</p>

            <GuestAccessLabel variant="light" className="my-5" />

            <div className="design-letter-actions">
              <button type="button" className="design-letter-btn" onClick={onUpload}>
                <Camera className="size-4" aria-hidden />
                Upload photos
              </button>
              <button type="button" className="design-letter-btn design-letter-btn-ghost" onClick={onGallery}>
                <Images className="size-4" aria-hidden />
                View gallery
              </button>
            </div>
          </article>
        )}
      </main>

      <LandingFooter privacyMode={event.privacyMode} className="design-letter-footer" />
    </div>
  );
}
