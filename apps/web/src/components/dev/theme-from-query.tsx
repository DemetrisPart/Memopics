"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGuestTheme } from "@/lib/themes/theme-provider";
import { normalizeGuestThemeId } from "@/lib/themes/types";

/** Dev/preview: apply theme from ?theme=original|cinematic|cinematic-noir|... */
export function ThemeFromQuery() {
  const searchParams = useSearchParams();
  const { setTheme } = useGuestTheme();

  useEffect(() => {
    const param = searchParams.get("theme");
    if (param) {
      setTheme(normalizeGuestThemeId(param));
    }
  }, [searchParams, setTheme]);

  return null;
}
