import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QrDesignClient } from "@/components/guest/designs/qr-design-client";
import { fetchPublicEventQr } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const qr = await fetchPublicEventQr(slug);
    return {
      title: `QR Code — ${qr.title} | Momeva`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "QR Code | Momeva", robots: { index: false } };
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

  return <QrDesignClient slug={slug} qr={qr} />;
}
