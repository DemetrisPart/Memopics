"use client";

import Link from "next/link";
import { OriginalQrPrintCard } from "@/components/guest/original-qr-print-card";
import { CoupleNamesHeading } from "@/components/guest/couple-names-heading";
import { EventQrActions } from "@/components/guest/event-qr-actions";
import { useGuestTheme } from "@/lib/themes/theme-provider";
import type { PublicEventQr } from "@/lib/api/types";
import { formatEventDate } from "@/lib/utils";

type QrDesignClientProps = {
  slug: string;
  qr: PublicEventQr;
};

function QrImage({ qr }: { qr: PublicEventQr }) {
  return (
    <div className="design-qr-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${qr.qrCodePngBase64}`}
        alt={`QR code for ${qr.title}`}
        width={256}
        height={256}
        className="size-64"
      />
    </div>
  );
}

export function QrDesignClient({ slug, qr }: QrDesignClientProps) {
  const { theme } = useGuestTheme();
  const date = formatEventDate(qr.eventDate);

  const back = (
    <Link href={`/${slug}`} className="design-qr-back print:hidden">
      ← Back to event page
    </Link>
  );

  const meta = (
    <EventQrActions
      slug={qr.slug}
      qrCodePngBase64={qr.qrCodePngBase64}
      className="mt-8"
    />
  );

  if (theme === "garden") {
    return (
      <main className="design-qr-garden-bg min-h-dvh px-4 py-8">
        <div className="mx-auto max-w-md">
          {back}
          <div className="design-qr-garden mt-6 p-8 text-center">
            <p className="design-garden-welcome justify-center">Scan to join</p>
            <CoupleNamesHeading
              groomName={qr.groomName}
              brideName={qr.brideName}
              fallback={qr.title}
              className="design-garden-names font-couple mt-4 text-[2rem]"
            />
            <p className="design-garden-date mt-2">{date}</p>
            <div className="mx-auto mt-8 inline-block"><QrImage qr={qr} /></div>
            {meta}
          </div>
        </div>
      </main>
    );
  }

  if (theme === "ticket") {
    return (
      <main className="design-ticket min-h-dvh px-4 py-8">
        <div className="mx-auto max-w-md">
          {back}
          <div className="design-qr-ticket mt-6 p-6">
            <p className="design-ticket-label">Scan ticket</p>
            <CoupleNamesHeading
              groomName={qr.groomName}
              brideName={qr.brideName}
              fallback={qr.title}
              className="design-ticket-names font-couple mt-2 text-[1.75rem]"
            />
            <p className="design-ticket-date mt-1">{date}</p>
            <div className="mt-6 inline-block"><QrImage qr={qr} /></div>
            {meta}
          </div>
        </div>
      </main>
    );
  }

  if (theme === "stories") {
    return (
      <main className="design-stories min-h-dvh px-4 py-8">
        <div className="mx-auto max-w-md text-white">
          {back}
          <div className="design-qr-stories mt-6 rounded-2xl p-6 text-center">
            <CoupleNamesHeading
              groomName={qr.groomName}
              brideName={qr.brideName}
              fallback={qr.title}
              className="font-couple text-[2rem] text-white"
            />
            <p className="design-stories-meta mt-2">{date}</p>
            <div className="mx-auto mt-8 inline-block rounded-xl bg-white p-3"><QrImage qr={qr} /></div>
            {meta}
          </div>
        </div>
      </main>
    );
  }

  if (theme === "wallet") {
    return (
      <main className="design-wallet min-h-dvh px-4 py-8">
        <div className="mx-auto max-w-md">
          {back}
          <article className="design-wallet-pass design-qr-wallet mt-6 p-6 text-left">
            <header className="design-wallet-pass-head mb-4">
              <span>MEMOPICS PASS · QR</span>
            </header>
            <CoupleNamesHeading
              groomName={qr.groomName}
              brideName={qr.brideName}
              fallback={qr.title}
              className="design-wallet-names font-couple text-[1.75rem]"
            />
            <p className="design-wallet-field-value mt-2">{date}</p>
            <div className="mt-6 inline-block w-full text-center"><QrImage qr={qr} /></div>
            {meta}
          </article>
        </div>
      </main>
    );
  }

  if (theme === "bento" || theme === "letter" || theme === "neon" || theme === "split" || theme === "luxury" || theme === "album" || theme === "editorial") {
    const bg =
      theme === "bento"
        ? "bg-zinc-100"
        : theme === "letter"
          ? "design-letter"
          : theme === "neon"
            ? "design-neon"
            : "design-split";
    return (
      <main className={`min-h-dvh px-4 py-8 ${bg}`}>
        <div className="mx-auto max-w-md">
          {back}
          <div className="design-qr-card design-qr-original mt-6 p-8 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
              {theme} · Scan to share
            </p>
            <CoupleNamesHeading
              groomName={qr.groomName}
              brideName={qr.brideName}
              fallback={qr.title}
              className="font-couple mt-3 text-[2rem] leading-[1.05]"
            />
            <p className="mt-2 text-base opacity-60">{date}</p>
            <div className="mx-auto mt-8 inline-block"><QrImage qr={qr} /></div>
            {meta}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="guest-page-bg min-h-dvh px-4 py-8 print:bg-white print:py-4">
      <div className="mx-auto max-w-md">
        {back}
        <div className="mt-6">
          <OriginalQrPrintCard qr={qr} />
        </div>
      </div>
    </main>
  );
}
