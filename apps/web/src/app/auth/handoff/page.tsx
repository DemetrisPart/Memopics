"use client";

import { useEffect, useState } from "react";

/**
 * Top-level auth handoff for Mobile Preview / iframe contexts.
 * Reads tokens from the URL hash (never sent to the server), establishes
 * HttpOnly cookies as a first-party request, then continues to dashboard.
 */
export default function AuthHandoffPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access")?.trim() ?? "";
    const refreshToken = params.get("refresh")?.trim() ?? "";

    // Drop tokens from the address bar immediately.
    window.history.replaceState(null, "", "/auth/handoff");

    if (!accessToken || !refreshToken) {
      setError("Sign-in handoff was incomplete. Please try again.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/auth/establish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ accessToken, refreshToken }),
        });
        if (!res.ok) {
          throw new Error("Could not establish session");
        }
        window.location.replace("/dashboard");
      } catch {
        setError("Could not finish sign-in. Please try again.");
      }
    })();
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-charcoal-900">
              Sign-in failed
            </h1>
            <p className="mt-3 text-sm text-stone-400">{error}</p>
            <a
              href="/auth/login"
              className="mt-6 inline-block text-sm font-medium text-gold-700 hover:underline"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-600" />
            <p className="mt-4 text-sm text-stone-400">Signing you in…</p>
          </>
        )}
      </div>
    </main>
  );
}
