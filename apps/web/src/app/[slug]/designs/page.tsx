import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DesignsPreview } from "@/components/dev/designs-preview";

type DesignsPageProps = {
  params: Promise<{ slug: string }>;
};

/** Dev-only — side-by-side preview of all 5 guest landing designs */
export default async function DesignsPage({ params }: DesignsPageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { slug } = await params;

  return (
    <Suspense>
      <DesignsPreview slug={slug} />
    </Suspense>
  );
}
