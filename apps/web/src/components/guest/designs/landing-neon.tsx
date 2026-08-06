import { Camera, Images, Zap } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Neon — dark party, glowing sign typography, cover as background */
export function LandingNeon({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-neon min-h-dvh">
      <section className="design-neon-bg">
        <EventHeroCover
          coverImageUrl={event.coverImageUrl}
          coverImageUrlLan={event.coverImageUrlLan}
          coverImageUrlPublic={event.coverImageUrlPublic}
        />
        <div className="design-neon-darken" aria-hidden />
      </section>

      <main className="design-neon-content">
        <p className="design-neon-tag">
          <Zap className="size-3.5" aria-hidden />
          After dark
        </p>

        <CoupleNamesHeading
          groomName={event.groomName}
          brideName={event.brideName}
          fallback={event.title}
          className="design-neon-names font-couple text-[2.75rem] leading-[1] sm:text-[3.5rem]"
        />

        <p className="design-neon-date">{formatEventDate(event.eventDate)}</p>

        <GuestAccessLabel variant="cinematic" className="my-6" />

        <div className="design-neon-actions">
          <button type="button" className="design-neon-btn design-neon-btn-pink" onClick={onUpload}>
            <Camera className="size-5" aria-hidden />
            Upload
          </button>
          <button type="button" className="design-neon-btn design-neon-btn-cyan" onClick={onGallery}>
            <Images className="size-5" aria-hidden />
            Gallery
          </button>
        </div>
      </main>

      <LandingFooter privacyMode={event.privacyMode} className="design-neon-footer" />
    </div>
  );
}
