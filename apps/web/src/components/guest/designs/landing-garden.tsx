import { Camera, Images, Leaf } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Botanical garden — circular photo, blush/green, stacked soft pills */
export function LandingGarden({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-garden min-h-dvh">
      <div className="design-garden-bloom design-garden-bloom-tl" aria-hidden />
      <div className="design-garden-bloom design-garden-bloom-br" aria-hidden />

      <main className="design-garden-main">
        <p className="design-garden-welcome">
          <Leaf className="size-3.5" aria-hidden />
          You&apos;re invited
        </p>

        <div className="design-garden-portrait">
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
          className="design-garden-names font-couple text-[2.5rem] leading-[1.05] sm:text-[3rem]"
        />

        <p className="design-garden-date">{formatEventDate(event.eventDate)}</p>

        <GuestAccessLabel variant="light" className="my-6" />

        <div className="design-garden-actions">
          <button type="button" className="design-garden-btn design-garden-btn-primary" onClick={onUpload}>
            <Camera className="size-4" aria-hidden />
            Share photos
          </button>
          <button type="button" className="design-garden-btn design-garden-btn-secondary" onClick={onGallery}>
            <Images className="size-4" aria-hidden />
            Gallery
          </button>
        </div>

        <LandingFooter privacyMode={event.privacyMode} className="design-garden-footer mt-8" />
      </main>
    </div>
  );
}
