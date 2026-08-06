"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQrDownloadUrl } from "@/lib/api/dashboard-client";
import type { EventQrPayload } from "@/lib/api/types";

type DashboardQrClientProps = {
  eventId: string;
  qr: EventQrPayload;
};

export function DashboardQrClient({ eventId, qr }: DashboardQrClientProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qr.eventUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", qr.eventUrl);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${qr.qrCodePngBase64}`}
          alt={`QR code for ${qr.slug}`}
          className="mx-auto h-64 w-64 max-w-full"
        />
        <p className="mt-4 break-all text-sm text-stone-400">{qr.eventUrl}</p>
      </div>

      <div className="space-y-3">
        <Button fullWidth onClick={copyLink} variant="secondary">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy guest link
            </>
          )}
        </Button>
        <a
          href={getQrDownloadUrl(eventId)}
          download={`${qr.slug}-qr.png`}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-600 to-gold-700 px-6 text-base font-medium text-ivory-50 shadow-soft hover:from-gold-700"
        >
          Download QR PNG
        </a>
      </div>

      <div className="rounded-xl bg-ivory-100 px-4 py-3 text-sm text-stone-400">
        <p className="font-medium text-charcoal-800">Tips</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Place QR on tables, bar, or entrance</li>
          <li>Guests scan to upload photos instantly</li>
          <li>Print at A5 or larger for easy scanning</li>
        </ul>
      </div>
    </div>
  );
}
