export const GUEST_THEME_IDS = [
  "original",
  "garden",
  "ticket",
  "stories",
  "wallet",
  "bento",
  "letter",
  "neon",
  "split",
  "luxury",
  "album",
  "editorial",
] as const;

export type GuestThemeId = (typeof GUEST_THEME_IDS)[number];

export const GUEST_THEME_STORAGE_KEY = "memopics_guest_theme";

export const GUEST_THEME_LABELS: Record<
  GuestThemeId,
  { label: string; description: string }
> = {
  original: {
    label: "Αρχικό",
    description: "Hero fade + glass card",
  },
  garden: {
    label: "Garden",
    description: "Botanical — circular portrait + soft cards",
  },
  ticket: {
    label: "Ticket",
    description: "Concert ticket — stub tear + barcode",
  },
  stories: {
    label: "Stories",
    description: "Social stories — progress bars + tap zones",
  },
  wallet: {
    label: "Wallet",
    description: "Digital pass — wallet card on phone bg",
  },
  bento: {
    label: "Bento",
    description: "Dashboard grid — photo + tile actions",
  },
  letter: {
    label: "Letter",
    description: "Envelope opens to handwritten invite",
  },
  neon: {
    label: "Neon",
    description: "Night party — glowing sign typography",
  },
  split: {
    label: "Split",
    description: "50/50 photo + editorial panel",
  },
  luxury: {
    label: "Luxury",
    description: "Venue-grade hero + sticky action bar",
  },
  album: {
    label: "Album",
    description: "Shared album app — grid + storage bar",
  },
  editorial: {
    label: "Editorial",
    description: "Magazine cover spread — realistic publish",
  },
};

const LEGACY_THEME_MAP: Record<string, GuestThemeId> = {
  atelier: "garden",
  lumiere: "stories",
  arc: "ticket",
  frame: "stories",
  postcard: "garden",
  mono: "wallet",
  cinematic: "stories",
  "cinematic-noir": "wallet",
  "cinematic-red": "ticket",
  "cinematic-analog": "garden",
};

export function isGuestThemeId(value: string): value is GuestThemeId {
  return (GUEST_THEME_IDS as readonly string[]).includes(value);
}

export function normalizeGuestThemeId(value: string | null): GuestThemeId {
  if (!value) return "original";
  if (isGuestThemeId(value)) return value;
  return LEGACY_THEME_MAP[value] ?? "original";
}
