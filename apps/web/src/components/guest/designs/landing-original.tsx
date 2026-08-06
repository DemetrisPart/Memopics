import { Camera, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventHero } from "@/components/guest/event-hero";
import { GuestAccessLabel } from "@/components/guest/guest-access-label";
import { LandingFooter, type LandingDesignProps } from "./landing-shared";

/** Production landing — Mediterranean classic (Αρχικό template) */
export function LandingOriginal({
  event,
  onUpload,
  onGallery,
}: LandingDesignProps) {
  return (
    <div className="min-h-dvh bg-ivory-50 guest-page-bg">
      <EventHero event={event} />

      <section className="relative mx-auto max-w-lg px-6 pb-10 pt-4">
        <div className="glass-card rounded-3xl p-6">
          <GuestAccessLabel className="mb-4" />

          <div className="space-y-3">
            <Button
              fullWidth
              className="min-h-[3.5rem] text-base"
              onClick={onUpload}
            >
              <Camera className="size-5" aria-hidden />
              Upload Photos
              <ChevronRight className="ml-auto size-4 opacity-60" aria-hidden />
            </Button>

            <Button
              variant="secondary"
              fullWidth
              className="min-h-12"
              onClick={onGallery}
            >
              <Images className="size-5" aria-hidden />
              View Gallery
              <ChevronRight className="ml-auto size-4 opacity-40" aria-hidden />
            </Button>
          </div>
        </div>

        <LandingFooter privacyMode={event.privacyMode} className="mt-6" />
      </section>
    </div>
  );
}
