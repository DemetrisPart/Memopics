import { ArrowUpRight } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Editorial magazine — cover spread, masthead, caption typography */
export function LandingEditorial({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <article className="design-editorial min-h-dvh">
      <header className="design-editorial-masthead">
        <span>Momeva</span>
        <span className="design-editorial-vol">Celebration Issue</span>
      </header>

      <section className="design-editorial-cover">
        <EventHeroCover
          coverImageUrl={event.coverImageUrl}
          coverImageUrlLan={event.coverImageUrlLan}
          coverImageUrlPublic={event.coverImageUrlPublic}
        />
        <div className="design-editorial-cover-scrim" aria-hidden />

        <div className="design-editorial-headline">
          <p className="design-editorial-kicker">Featured celebration</p>
          <CoupleNamesHeading
            groomName={event.groomName}
            brideName={event.brideName}
            fallback={event.title}
            className="design-editorial-names font-couple text-[2.75rem] leading-[0.98] sm:text-[3.5rem]"
          />
        </div>
      </section>

      <section className="design-editorial-body">
        <div className="design-editorial-columns">
          <div>
            <p className="design-editorial-caption-label">Date</p>
            <p className="design-editorial-caption">{formatEventDate(event.eventDate)}</p>
          </div>
          <div>
            <p className="design-editorial-caption-label">Your role</p>
            <p className="design-editorial-caption">Guest photographer</p>
          </div>
        </div>

        <p className="design-editorial-deck">
          You were there. Your angle matters. Upload candid moments and explore everyone&apos;s
          gallery in one place.
        </p>

        <GuestAccessLabel variant="light" className="my-6" />

        <nav className="design-editorial-nav">
          <button type="button" className="design-editorial-cta" onClick={onUpload}>
            <span>Contribute photos</span>
            <ArrowUpRight className="size-5" aria-hidden />
          </button>
          <button type="button" className="design-editorial-cta design-editorial-cta-muted" onClick={onGallery}>
            <span>Read the gallery</span>
            <ArrowUpRight className="size-5" aria-hidden />
          </button>
        </nav>

        <LandingFooter privacyMode={event.privacyMode} className="design-editorial-footer mt-10" />
      </section>
    </article>
  );
}
