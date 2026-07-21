"use client";

import Image from "next/image";
import { resolveNetworkUrl } from "@/lib/mobile-network";

type EventHeroCoverProps = {
  coverImageUrl: string | null;
  coverImageUrlLan?: string | null;
  coverImageUrlPublic?: string | null;
};

export function EventHeroCover({
  coverImageUrl,
  coverImageUrlLan,
  coverImageUrlPublic,
}: EventHeroCoverProps) {
  if (!coverImageUrl) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#d4c4a8_0%,_#f9f5ee_55%)]" />
    );
  }

  const src = resolveNetworkUrl({
    url: coverImageUrl,
    lanUrl: coverImageUrlLan,
    publicUrl: coverImageUrlPublic,
  });

  return (
    <Image
      src={src}
      alt=""
      fill
      priority
      className="object-cover object-[center_25%]"
      sizes="100vw"
      unoptimized
    />
  );
}
