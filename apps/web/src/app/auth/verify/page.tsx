"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyMagicLink } from "@/lib/api/dashboard-client";
import { ApiError } from "@/lib/api/types";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      return;
    }

    void verifyMagicLink(token)
      .then(() => {
        // Full navigation so auth cookies are sent on the next request
        window.location.assign("/dashboard");
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not verify magic link",
        );
      });
  }, [token]);

  if (error) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-xl font-semibold text-charcoal-900">
          Link expired or invalid
        </h1>
        <p className="mt-3 text-sm text-stone-400">{error}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-medium text-gold-700 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-600" />
      <p className="mt-4 text-sm text-stone-400">Signing you in…</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm text-stone-400">Loading…</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </main>
  );
}
