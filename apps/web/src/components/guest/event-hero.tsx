import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { formatEventDate } from "@/lib/utils";
import type { PublicEvent } from "@/lib/api/types";

type EventHeroProps = {
  event: PublicEvent;
};

export function EventHero({ event }: EventHeroProps) {
  const displayNames =
    event.brideName && event.groomName
      ? `${event.brideName} & ${event.groomName}`
      : event.title;

  return (
    <section className="relative min-h-[62vh] overflow-hidden bg-charcoal-900">
      {event.coverImageUrl ? (
        <Image
          src={event.coverImageUrl}
          alt=""
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3d3834_0%,_#1a1714_70%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/40 to-charcoal-900/10" />

      {/* Decorative frame */}
      <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/10 sm:inset-6" />

      <div className="absolute inset-x-0 bottom-0 p-6 pb-10">
        <div className="mx-auto max-w-lg">
          <div className="glass-card rounded-3xl px-6 py-6 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold-600">
              Celebration
            </p>
            <h1 className="mt-2 font-serif text-[2rem] leading-[1.15] text-charcoal-900 sm:text-4xl">
              {displayNames}
            </h1>
            <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-ivory-100 px-4 py-2 text-sm text-stone-400">
              <CalendarDays className="size-4 text-gold-600" aria-hidden />
              <span>{formatEventDate(event.eventDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
