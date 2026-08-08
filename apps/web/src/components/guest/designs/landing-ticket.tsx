import { Camera, Images } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

function randomBars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Array.from({ length: 28 }, (_, i) => {
    h = (h * 1103515245 + 12345 + i) | 0;
    return 20 + (Math.abs(h) % 70);
  });
}

/** Concert ticket — perforated tear, stub, barcode */
export function LandingTicket({ event, onUpload, onGallery }: LandingDesignProps) {
  const bars = randomBars(event.slug + event.eventDate);
  const names = [event.groomName, event.brideName].filter(Boolean).join(" & ") || event.title;

  return (
    <div className="design-ticket min-h-dvh">
      <main className="design-ticket-sheet">
        <div className="design-ticket-main">
          <div className="design-ticket-thumb">
            <EventHeroCover
              coverImageUrl={event.coverImageUrl}
              coverImageUrlLan={event.coverImageUrlLan}
              coverImageUrlPublic={event.coverImageUrlPublic}
            />
          </div>

          <div className="design-ticket-info">
            <p className="design-ticket-label">Admit all guests</p>
            <CoupleNamesHeading
              groomName={event.groomName}
              brideName={event.brideName}
              fallback={event.title}
              className="design-ticket-names font-couple text-[1.75rem] leading-[1.05]"
            />
            <p className="design-ticket-date">{formatEventDate(event.eventDate)}</p>
            <p className="design-ticket-venue">Momeva Live Event</p>
          </div>

          <div className="design-ticket-barcode" aria-hidden>
            {bars.map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="design-ticket-code">{event.slug.toUpperCase().slice(0, 12)}</p>
        </div>

        <div className="design-ticket-perforation" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="design-ticket-stub">
          <p className="design-ticket-stub-title">{names}</p>
          <GuestAccessLabel variant="light" className="my-4" />
          <button type="button" className="design-ticket-stub-btn" onClick={onUpload}>
            <Camera className="size-4" aria-hidden />
            Upload
          </button>
          <button type="button" className="design-ticket-stub-link" onClick={onGallery}>
            <Images className="size-4" aria-hidden />
            Gallery
          </button>
        </div>

        <LandingFooter privacyMode={event.privacyMode} className="design-ticket-footer mt-6" />
      </main>
    </div>
  );
}
