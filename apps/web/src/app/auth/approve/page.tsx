"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { approveMagicLink } from "@/lib/api/dashboard-client";
import { ApiError } from "@/lib/api/types";

function ApproveContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing approval token");
      return;
    }

    void approveMagicLink(token)
      .then(() => setStatus("done"))
      .catch((err) => {
        setStatus("error");
        setError(
          err instanceof ApiError ? err.message : "Could not approve sign-in",
        );
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-600" />
        <p className="mt-4 text-sm text-stone-400">Approving sign-in…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-xl font-semibold text-charcoal-900">
          Approval failed
        </h1>
        <p className="mt-3 text-sm text-stone-400">{error}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-medium text-gold-700 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
      <h1 className="text-2xl font-semibold text-charcoal-900">Approved</h1>
      <p className="mt-3 text-sm text-stone-400">
        Return to Momeva on your other device — it will sign you in
        automatically. You can close this tab.
      </p>
    </div>
  );
}

export default function ApprovePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm text-stone-400">Loading…</p>
          </div>
        }
      >
        <ApproveContent />
      </Suspense>
    </main>
  );
}
