import { ArrowRight, Camera, Images } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Split — 50/50 photo panel + solid editorial panel */
export function LandingSplit({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-split min-h-dvh">
      <section className="design-split-photo">
        <EventHeroCover
          coverImageUrl={event.coverImageUrl}
          coverImageUrlLan={event.coverImageUrlLan}
          coverImageUrlPublic={event.coverImageUrlPublic}
        />
      </section>

      <section className="design-split-panel">
        <p className="design-split-index">01 — Event</p>
        <CoupleNamesHeading
          groomName={event.groomName}
          brideName={event.brideName}
          fallback={event.title}
          className="design-split-names font-couple text-[2.25rem] leading-[1.02] sm:text-[2.75rem]"
        />
        <p className="design-split-date">{formatEventDate(event.eventDate)}</p>
        <p className="design-split-copy">
          Capture the night from your perspective. Every guest adds a chapter.
        </p>

        <GuestAccessLabel variant="light" className="my-6 !justify-start" />

        <nav className="design-split-nav">
          <button type="button" className="design-split-link" onClick={onUpload}>
            <span>Upload photos</span>
            <ArrowRight className="size-5" aria-hidden />
          </button>
          <button type="button" className="design-split-link" onClick={onGallery}>
            <span>View gallery</span>
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </nav>

        <div className="design-split-icons" aria-hidden>
          <Camera className="size-4 opacity-30" />
          <Images className="size-4 opacity-30" />
        </div>

        <LandingFooter privacyMode={event.privacyMode} className="design-split-footer mt-auto pt-8" />
      </section>
    </div>
  );
}
