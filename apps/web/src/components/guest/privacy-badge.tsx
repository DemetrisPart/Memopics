import { Lock, Globe } from "lucide-react";
import type { PrivacyMode } from "@/lib/api/types";

type PrivacyBadgeProps = {
  privacyMode: PrivacyMode;
};

export function PrivacyBadge({ privacyMode }: PrivacyBadgeProps) {
  const isPrivate = privacyMode === "OWN_UPLOADS_ONLY";

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-soft ${
        isPrivate
          ? "border-gold-100 bg-gold-100/60 text-charcoal-800"
          : "border-stone-200 bg-white text-charcoal-800"
      }`}
    >
      {isPrivate ? (
        <>
          <Lock className="size-4 shrink-0 text-gold-600" aria-hidden />
          <span>You&apos;ll only see photos you upload</span>
        </>
      ) : (
        <>
          <Globe className="size-4 shrink-0 text-gold-600" aria-hidden />
          <span>All guest uploads are visible to everyone</span>
        </>
      )}
    </div>
  );
}
