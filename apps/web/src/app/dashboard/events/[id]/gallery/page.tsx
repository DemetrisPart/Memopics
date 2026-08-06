import { CoupleGalleryClient } from "@/components/dashboard/couple-gallery-client";

type GalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventGalleryPage({ params }: GalleryPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-4 text-lg font-semibold text-charcoal-900">Gallery</h2>
      <CoupleGalleryClient eventId={id} />
    </div>
  );
}
