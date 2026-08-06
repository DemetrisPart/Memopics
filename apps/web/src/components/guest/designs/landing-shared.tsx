import Link from "next/link";
import { PrivacyBadge } from "@/components/guest/privacy-badge";
import type { PrivacyMode } from "@/lib/api/types";

type LandingFooterProps = {
  privacyMode: PrivacyMode;
  className?: string;
};

export function LandingFooter({ privacyMode, className }: LandingFooterProps) {
  return (
    <div className={className}>
      <div className="flex justify-center">
        <PrivacyBadge privacyMode={privacyMode} />
      </div>
      <footer className="mt-8 text-center">
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
    </div>
  );
}

export type LandingDesignProps = {
  slug: string;
  event: import("@/lib/api/types").PublicEvent;
  onUpload: () => void;
  onGallery: () => void;
};
