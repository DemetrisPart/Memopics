import { DashboardQrClient } from "@/components/dashboard/dashboard-qr-client";
import { fetchEventQrServer } from "@/lib/api/server-fetch";
import type { EventQrPayload } from "@/lib/api/types";

type QrPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventQrPage({ params }: QrPageProps) {
  const { id } = await params;
  const qr = (await fetchEventQrServer(id)) as EventQrPayload;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-charcoal-900">
        QR & sharing
      </h2>
      <DashboardQrClient eventId={id} qr={qr} />
    </div>
  );
}
