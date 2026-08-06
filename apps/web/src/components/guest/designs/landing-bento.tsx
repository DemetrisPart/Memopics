import { Camera, Images } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Bento grid — dashboard tiles, photo + info + action cells */
export function LandingBento({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-bento min-h-dvh">
      <main className="design-bento-grid">
        <div className="design-bento-cell design-bento-photo">
          <EventHeroCover
            coverImageUrl={event.coverImageUrl}
            coverImageUrlLan={event.coverImageUrlLan}
            coverImageUrlPublic={event.coverImageUrlPublic}
          />
          <span className="design-bento-badge">Live event</span>
        </div>

        <div className="design-bento-cell design-bento-names">
          <p className="design-bento-label">Celebrating</p>
          <CoupleNamesHeading
            groomName={event.groomName}
            brideName={event.brideName}
            fallback={event.title}
            className="design-bento-title font-couple text-[1.75rem] leading-[1.05]"
          />
        </div>

        <div className="design-bento-cell design-bento-date">
          <p className="design-bento-label">Date</p>
          <p className="design-bento-date-text">{formatEventDate(event.eventDate)}</p>
        </div>

        <div className="design-bento-cell design-bento-access">
          <GuestAccessLabel variant="light" className="!justify-start" />
        </div>

        <button
          type="button"
          className="design-bento-cell design-bento-upload"
          onClick={onUpload}
        >
          <Camera className="size-6" aria-hidden />
          <span>Upload photos</span>
        </button>

        <button
          type="button"
          className="design-bento-cell design-bento-gallery"
          onClick={onGallery}
        >
          <Images className="size-6" aria-hidden />
          <span>Gallery</span>
        </button>
      </main>

      <LandingFooter privacyMode={event.privacyMode} className="design-bento-footer" />
    </div>
  );
}
