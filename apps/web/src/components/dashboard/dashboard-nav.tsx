"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, QrCode, Settings } from "lucide-react";
import { cn, formatCoupleNames } from "@/lib/utils";
import type { CoupleEvent } from "@/lib/api/types";

type DashboardBottomNavProps = {
  event: CoupleEvent;
};

const tabs = [
  { href: "", label: "Home", icon: Home, suffix: "" },
  { href: "/gallery", label: "Gallery", icon: Images, suffix: "gallery" },
  { href: "/qr", label: "QR", icon: QrCode, suffix: "qr" },
  { href: "/settings", label: "Settings", icon: Settings, suffix: "settings" },
] as const;

export function DashboardBottomNav({ event }: DashboardBottomNavProps) {
  const pathname = usePathname();
  const base = `/dashboard/events/${event.id}`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Event dashboard"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, suffix }) => {
          const path = `${base}${href}`;
          const active =
            suffix === ""
              ? pathname === base
              : pathname.startsWith(`${base}/${suffix}`);
          return (
            <Link
              key={label}
              href={path}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-gold-700"
                  : "text-stone-400 hover:text-charcoal-800",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardEventHeader({ event }: { event: CoupleEvent }) {
  return (
    <header className="border-b border-stone-200 bg-white px-4 py-4 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
        Event dashboard
      </p>
      <h1 className="mt-0.5 text-xl font-semibold text-charcoal-900">
        {formatCoupleNames(event.groomName, event.brideName, event.title)}
      </h1>
      <p className="mt-0.5 text-sm text-stone-400">/{event.slug}</p>
    </header>
  );
}

export function DashboardSidebar({ event }: { event: CoupleEvent }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${event.id}`;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white lg:block">
      <div className="sticky top-0 px-4 py-6">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-stone-400 hover:text-charcoal-800"
        >
          ← All events
        </Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-stone-400">
          Event
        </p>
        <p className="mt-1 font-semibold text-charcoal-900">
          {formatCoupleNames(event.groomName, event.brideName, event.title)}
        </p>
        <nav className="mt-6 space-y-1" aria-label="Event sections">
          {tabs.map(({ href, label, icon: Icon, suffix }) => {
            const path = `${base}${href}`;
            const active =
              suffix === ""
                ? pathname === base
                : pathname.startsWith(`${base}/${suffix}`);
            return (
              <Link
                key={label}
                href={path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold-100 text-gold-700"
                    : "text-charcoal-800 hover:bg-ivory-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
