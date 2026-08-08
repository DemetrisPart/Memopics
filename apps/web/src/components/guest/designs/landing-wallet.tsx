import { Camera, Images, QrCode } from "lucide-react";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { EventHeroCover } from "@/components/guest/event-hero-cover";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";
import { formatEventDate } from "@/lib/utils";

/** Apple Wallet pass — card on phone-gray background, strip image, field rows */
export function LandingWallet({ event, onUpload, onGallery }: LandingDesignProps) {
  return (
    <div className="design-wallet min-h-dvh">
      <div className="design-wallet-status" aria-hidden>
        <span>9:41</span>
        <span className="design-wallet-notch" />
        <span>●●●</span>
      </div>

      <main className="design-wallet-stage">
        <article className="design-wallet-pass">
          <header className="design-wallet-pass-head">
            <QrCode className="size-4 opacity-70" aria-hidden />
            <span>Momeva PASS</span>
          </header>

          <div className="design-wallet-strip">
            <EventHeroCover
              coverImageUrl={event.coverImageUrl}
              coverImageUrlLan={event.coverImageUrlLan}
              coverImageUrlPublic={event.coverImageUrlPublic}
            />
          </div>

          <div className="design-wallet-body">
            <CoupleNamesHeading
              groomName={event.groomName}
              brideName={event.brideName}
              fallback={event.title}
              className="design-wallet-names font-couple text-[1.875rem] leading-[1.05]"
            />

            <div className="design-wallet-fields">
              <div>
                <p className="design-wallet-field-label">Date</p>
                <p className="design-wallet-field-value">{formatEventDate(event.eventDate)}</p>
              </div>
              <div>
                <p className="design-wallet-field-label">Access</p>
                <p className="design-wallet-field-value">All guests</p>
              </div>
            </div>

            <GuestAccessLabel variant="cinematic" className="my-4" />

            <div className="design-wallet-actions">
              <button type="button" className="design-wallet-action" onClick={onUpload}>
                <Camera className="size-4" aria-hidden />
                Upload photos
              </button>
              <button type="button" className="design-wallet-action design-wallet-action-muted" onClick={onGallery}>
                <Images className="size-4" aria-hidden />
                Open gallery
              </button>
            </div>
          </div>
        </article>

        <LandingFooter privacyMode={event.privacyMode} className="design-wallet-footer" />
      </main>
    </div>
  );
}
