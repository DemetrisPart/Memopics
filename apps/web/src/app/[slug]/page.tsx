import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventLandingClient } from "@/components/guest/event-landing-client";
import { fetchPublicEvent } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const event = await fetchPublicEvent(slug);
    return {
      title: `${event.title} | Memopics`,
      description: `Share photos from ${event.title}`,
      robots: { index: false, follow: false },
      openGraph: {
        title: event.title,
        description: `Share photos from ${event.title}`,
        images: event.coverImageUrl ? [{ url: event.coverImageUrl }] : [],
      },
    };
  } catch {
    return { title: "Event | Memopics", robots: { index: false } };
  }
}

export default async function EventLandingPage({ params }: PageProps) {
  const { slug } = await params;

  let event;
  try {
    event = await fetchPublicEvent(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="min-h-dvh">
      <Suspense>
        <EventLandingClient slug={slug} event={event} />
      </Suspense>
    </main>
  );
}
