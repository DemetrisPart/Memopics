"use client";

import Link from "next/link";
import { Images, QrCode, Settings } from "lucide-react";

type QuickActionsProps = {
  eventId: string;
};

const actions = [
  {
    href: "gallery",
    label: "Gallery",
    description: "View all photos",
    icon: Images,
  },
  {
    href: "qr",
    label: "QR & share",
    description: "Print or download",
    icon: QrCode,
  },
  {
    href: "settings",
    label: "Settings",
    description: "Edit event details",
    icon: Settings,
  },
] as const;

export function QuickActions({ eventId }: QuickActionsProps) {
  const base = `/dashboard/events/${eventId}`;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={`${base}/${href}`}
          className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-soft transition-colors hover:border-gold-400/40 hover:bg-ivory-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-charcoal-900">
              {label}
            </span>
            <span className="mt-0.5 block text-xs text-stone-400">
              {description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
