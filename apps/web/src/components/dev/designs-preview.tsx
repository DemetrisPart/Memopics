"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { GUEST_THEME_IDS, GUEST_THEME_LABELS, type GuestThemeId } from "@/lib/themes/types";

type DesignsPreviewProps = {
  slug: string;
};

const PREVIEW_ACCENTS: Record<GuestThemeId, string> = {
  original: "#c9a962",
  garden: "#4d7a57",
  ticket: "#1a1a1a",
  stories: "#f472b6",
  wallet: "#1e3a5f",
  bento: "#6366f1",
  letter: "#c45c5c",
  neon: "#ec4899",
  split: "#fafafa",
  luxury: "#8a7340",
  album: "#007aff",
  editorial: "#111111",
};

export function DesignsPreview({ slug }: DesignsPreviewProps) {
  const searchParams = useSearchParams();
  const active = searchParams.get("focus") as GuestThemeId | null;

  return (
    <div className="designs-preview min-h-dvh bg-[#111] text-[#fdfbf7]">
      <header className="designs-preview-header">
        <div>
          <p className="designs-preview-kicker">Dev only — UI preview</p>
          <h1 className="designs-preview-title">Όλα τα {GUEST_THEME_IDS.length} designs</h1>
          <p className="designs-preview-sub">
            Event: <strong>{slug}</strong> — tap a card for full screen
          </p>
        </div>
        <Link href={`/${slug}`} className="designs-preview-back">
          ← Live landing
        </Link>
      </header>

      <div className={`designs-preview-grid ${active ? "designs-preview-grid-focus" : ""}`}>
        {GUEST_THEME_IDS.map((id) => {
          const { label, description } = GUEST_THEME_LABELS[id];
          const href = `/${slug}?theme=${id}`;
          const embedSrc = `/${slug}?theme=${id}&embed=1`;
          const isFocused = active === id;

          return (
            <article
              key={id}
              className={`designs-preview-card ${isFocused ? "designs-preview-card-active" : ""}`}
              style={{ "--preview-accent": PREVIEW_ACCENTS[id] } as CSSProperties}
            >
              <div className="designs-preview-card-head">
                <div>
                  <h2 className="designs-preview-card-title">{label}</h2>
                  <p className="designs-preview-card-desc">{description}</p>
                </div>
                <Link href={href} className="designs-preview-open">
                  Open full ↗
                </Link>
              </div>

              <div className="designs-preview-frame-wrap">
                <iframe
                  title={`${label} preview`}
                  src={embedSrc}
                  className="designs-preview-frame"
                  loading="lazy"
                />
              </div>

              <Link
                href={`/${slug}/designs?focus=${id}`}
                className="designs-preview-focus-link"
              >
                Focus this design
              </Link>
            </article>
          );
        })}
      </div>

      {active ? (
        <div className="designs-preview-focus-bar">
          <Link href={`/${slug}/designs`} className="designs-preview-focus-reset">
            Show all {GUEST_THEME_IDS.length}
          </Link>
          <Link
            href={`/${slug}?theme=${active}`}
            className="designs-preview-focus-open"
          >
            Open {GUEST_THEME_LABELS[active].label} full screen
          </Link>
        </div>
      ) : null}
    </div>
  );
}
