"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { GuestThemeId } from "./types";

type GuestThemeContextValue = {
  theme: GuestThemeId;
  setTheme: (theme: GuestThemeId) => void;
  resetToOriginal: () => void;
};

const GuestThemeContext = createContext<GuestThemeContextValue | null>(null);

function applyThemeToDocument(theme: GuestThemeId): void {
  document.documentElement.dataset.guestTheme = theme;
}

export function GuestThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: GuestThemeId = "original";

  useEffect(() => {
    applyThemeToDocument("original");
  }, []);

  const setTheme = useCallback((_next: GuestThemeId) => {
    applyThemeToDocument("original");
  }, []);

  const resetToOriginal = useCallback(() => {
    applyThemeToDocument("original");
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resetToOriginal }),
    [theme, setTheme, resetToOriginal],
  );

  return (
    <GuestThemeContext.Provider value={value}>
      {children}
    </GuestThemeContext.Provider>
  );
}

export function useGuestTheme(): GuestThemeContextValue {
  const context = useContext(GuestThemeContext);
  if (!context) {
    throw new Error("useGuestTheme must be used within GuestThemeProvider");
  }
  return context;
}
