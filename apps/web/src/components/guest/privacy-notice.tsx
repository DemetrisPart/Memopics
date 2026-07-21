"use client";

import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "memopics_privacy_notice_dismissed";

export function dismissPrivacyNotice(slug: string): void {
  sessionStorage.setItem(`${DISMISS_KEY}_${slug}`, "1");
}

export function PrivacyNoticeBanner({
  slug,
  dismissed,
  onDismiss,
  className,
}: {
  slug: string;
  dismissed: boolean;
  onDismiss: () => void;
  className?: string;
}) {
  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-gold-100 bg-gold-100/60 p-4${className ? ` ${className}` : ""}`}
    >
      <Lock className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal-900">
          My uploads are private unless the couple enables shared gallery.
        </p>
        <p className="mt-1 text-xs text-stone-400">
          You&apos;ll only see what you upload.
        </p>
      </div>
      <Button variant="ghost" className="min-h-8 px-2" onClick={onDismiss} aria-label="Dismiss">
        <X className="size-4" />
      </Button>
    </div>
  );
}
