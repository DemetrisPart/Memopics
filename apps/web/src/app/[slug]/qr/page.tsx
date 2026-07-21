import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventQrActions } from "@/components/guest/event-qr-actions";
import { fetchPublicEventQr } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { formatCoupleNames, formatEventDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const qr = await fetchPublicEventQr(slug);
    return {
      title: `QR Code — ${qr.title} | Memopics`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "QR Code | Memopics", robots: { index: false } };
  }
}

export default async function EventQrPage({ params }: PageProps) {
  const { slug } = await params;

  let qr;
  try {
    qr = await fetchPublicEventQr(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="guest-page-bg min-h-dvh px-4 py-8 print:bg-white print:py-4">
      <div className="mx-auto max-w-md">
        <div className="print:hidden">
          <Link
            href={`/${slug}`}
            className="text-sm text-stone-400 hover:text-charcoal-800"
          >
            ← Back to event page
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-charcoal-800/10 bg-white p-8 text-center shadow-soft print:mt-0 print:border-0 print:shadow-none">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold-600">
            Scan to share photos
          </p>
          <h1 className="font-couple mt-3 text-2xl font-medium tracking-[0.01em] text-charcoal-900">
            {formatCoupleNames(qr.groomName, qr.brideName, qr.title)}
          </h1>
          <p className="mt-2 text-base text-stone-400">
            {formatEventDate(qr.eventDate)}
          </p>

          <div className="mx-auto mt-8 inline-block rounded-2xl border border-stone-200 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${qr.qrCodePngBase64}`}
              alt={`QR code for ${qr.title}`}
              width={256}
              height={256}
              className="size-64"
            />
          </div>

          <p className="mt-6 text-sm leading-relaxed text-stone-400">
            Guests scan this code with their phone camera — no app install
            needed.
          </p>

          <EventQrActions slug={qr.slug} qrCodePngBase64={qr.qrCodePngBase64} />
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.15em] text-stone-400 print:hidden">
          Powered by Memopics
        </p>
      </div>
    </main>
  );
}
