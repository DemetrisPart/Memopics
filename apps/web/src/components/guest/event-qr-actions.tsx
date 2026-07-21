"use client";

type EventQrActionsProps = {
  slug: string;
  qrCodePngBase64: string;
};

export function EventQrActions({ slug, qrCodePngBase64 }: EventQrActionsProps) {
  return (
    <div className="mt-8 space-y-3 print:hidden">
      <a
        href={`data:image/png;base64,${qrCodePngBase64}`}
        download={`${slug}-qr.png`}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gold-600 px-6 text-base font-medium text-ivory-50 hover:bg-gold-700"
      >
        Download QR PNG
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-charcoal-800/15 bg-ivory-100 px-6 text-base font-medium text-charcoal-900 hover:bg-ivory-50"
      >
        Print
      </button>
    </div>
  );
}
