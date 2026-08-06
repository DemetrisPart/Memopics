"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useGuestTheme } from "@/lib/themes/theme-provider";
import {
  GUEST_THEME_IDS,
  GUEST_THEME_LABELS,
  type GuestThemeId,
} from "@/lib/themes/types";

/**
 * Dev-only theme picker — fixed top bar so it is impossible to miss on mobile/PC.
 * Say «αρχικό template» or tap Αρχικό to restore production look.
 */
export function ThemeSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme, resetToOriginal } = useGuestTheme();
  const slug = typeof params.slug === "string" ? params.slug : "";

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (searchParams.get("embed") === "1" || pathname.endsWith("/designs")) {
    return null;
  }

  return (
    <div className="theme-dev-bar print:hidden">
      <div className="theme-dev-bar-inner">
        <p className="theme-dev-bar-label">
          UI Preview
          <span className="theme-dev-bar-hint"> — δοκίμασε διαφορετικό design</span>
        </p>
        <div className="theme-dev-bar-tabs">
          {GUEST_THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id as GuestThemeId)}
              className={`theme-dev-bar-tab ${theme === id ? "theme-dev-bar-tab-active" : ""}`}
            >
              {GUEST_THEME_LABELS[id].label}
            </button>
          ))}
        </div>
        <Link href={`/${slug}/designs`} className="theme-dev-bar-all">
          Preview ({GUEST_THEME_IDS.length})
        </Link>
        <button
          type="button"
          onClick={() => resetToOriginal()}
          className="theme-dev-bar-reset"
        >
          Αρχικό template
        </button>
      </div>
    </div>
  );
}
