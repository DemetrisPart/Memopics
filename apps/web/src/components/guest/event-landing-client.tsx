"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventHero } from "@/components/guest/event-hero";
import { NameEntryModal } from "@/components/guest/name-entry-modal";
import { PrivacyBadge } from "@/components/guest/privacy-badge";
import { checkGuestSession } from "@/lib/api/client";
import type { PublicEvent } from "@/lib/api/types";

type EventLandingClientProps = {
  slug: string;
  event: PublicEvent;
};

export function EventLandingClient({ slug, event }: EventLandingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"upload" | "gallery" | null>(
    null,
  );

  const refreshSession = useCallback(async () => {
    try {
      const active = await checkGuestSession(slug);
      setHasSession(active);
      return active;
    } catch {
      setHasSession(false);
      return false;
    }
  }, [slug]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action !== "upload" && action !== "gallery") return;

    void refreshSession().then((active) => {
      if (active) {
        router.replace(`/${slug}/${action}`);
        return;
      }
      setPendingAction(action);
      setNameModalOpen(true);
    });
  }, [refreshSession, router, searchParams, slug]);

  async function navigateWithSession(action: "upload" | "gallery") {
    const active = await refreshSession();
    if (active) {
      router.push(`/${slug}/${action}`);
      return;
    }
    setPendingAction(action);
    setNameModalOpen(true);
  }

  function handleNameSuccess() {
    setHasSession(true);
    setNameModalOpen(false);

    if (pendingAction === "upload") {
      router.push(`/${slug}/upload`);
    } else if (pendingAction === "gallery") {
      router.push(`/${slug}/gallery`);
    }
    setPendingAction(null);
  }

  function handleModalClose() {
    setNameModalOpen(false);
    setPendingAction(null);
    if (searchParams.get("action")) {
      router.replace(`/${slug}`);
    }
  }

  return (
    <div className="guest-page-bg min-h-dvh">
      <EventHero event={event} />

      <section className="relative mx-auto max-w-lg px-6 pb-10 pt-4">
        <div className="glass-card rounded-3xl p-6">
          <p className="text-center text-[15px] leading-relaxed text-stone-400">
            Share your favourite moments from this celebration.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              fullWidth
              className="min-h-[3.5rem] text-base"
              onClick={() => void navigateWithSession("upload")}
            >
              <Camera className="size-5" aria-hidden />
              Upload Photos
              <ChevronRight className="ml-auto size-4 opacity-60" aria-hidden />
            </Button>

            <Button
              variant="secondary"
              fullWidth
              className="min-h-12"
              onClick={() => void navigateWithSession("gallery")}
            >
              <Images className="size-5" aria-hidden />
              View Gallery
              <ChevronRight className="ml-auto size-4 opacity-40" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <PrivacyBadge privacyMode={event.privacyMode} />
        </div>

        <footer className="mt-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">
            Powered by{" "}
            <Link
              href="/"
              className="font-medium text-gold-600 underline-offset-2 hover:underline"
            >
              Memopics
            </Link>
          </p>
        </footer>
      </section>

      <NameEntryModal
        slug={slug}
        open={nameModalOpen}
        onClose={handleModalClose}
        onSuccess={handleNameSuccess}
      />
    </div>
  );
}
