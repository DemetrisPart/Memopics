"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { approveMagicLink } from "@/lib/api/dashboard-client";
import { warmupAuthRoutes } from "@/lib/auth/warmup-verify-route";

type MagicLinkWaitingProps = {
  email: string;
  pollToken: string;
  verificationToken: string;
  onBack: () => void;
};

async function fetchPollStatus(
  pollToken: string,
): Promise<"pending" | "approved" | "expired"> {
  const res = await fetch(
    `/api/auth/complete?pollToken=${encodeURIComponent(pollToken)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    return "expired";
  }
  const body = (await res.json()) as { status?: string };
  if (body.status === "approved") return "approved";
  if (body.status === "expired") return "expired";
  return "pending";
}

export function MagicLinkWaiting({
  email,
  pollToken,
  verificationToken,
  onBack,
}: MagicLinkWaitingProps) {
  const [error, setError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const finishedRef = useRef(false);
  const warmupDoneRef = useRef(false);

  const finishSignIn = async (force = false) => {
    if (!force && finishedRef.current) return;
    finishedRef.current = true;

    if (!warmupDoneRef.current) {
      await warmupAuthRoutes();
      warmupDoneRef.current = true;
    }

    const finishUrl = new URL("/api/auth/finish", window.location.origin);
    finishUrl.searchParams.set("pollToken", pollToken);
    window.location.assign(finishUrl.toString());
  };

  useEffect(() => {
    void warmupAuthRoutes().then(() => {
      warmupDoneRef.current = true;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const status = await fetchPollStatus(pollToken);
        if (cancelled) return;

        if (status === "approved") {
          setApproved(true);
          void finishSignIn();
          return;
        }

        if (status === "expired") {
          setError("Sign-in request expired. Send a new magic link.");
          return;
        }

        setError(null);
      } catch {
        if (!cancelled) {
          setError("Could not check approval status");
        }
      }

      timeoutId = setTimeout(() => {
        void poll();
      }, 2000);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pollToken, verificationToken]);

  const devApprove = async () => {
    setDevLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dev/magic-link?email=${encodeURIComponent(email.trim())}`,
        { cache: "no-store" },
      );
      const body = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !body.token) {
        throw new Error(body.error ?? "Could not load dev approve token");
      }
      await approveMagicLink(body.token);

      for (let attempt = 0; attempt < 15; attempt += 1) {
        const status = await fetchPollStatus(pollToken);
        if (status === "approved") {
          setApproved(true);
          void finishSignIn();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      throw new Error("Approved, but sign-in did not complete — try again");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev approve failed");
      finishedRef.current = false;
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-charcoal-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-stone-400">
          We sent an approval to{" "}
          <strong className="text-charcoal-800">{email}</strong>. Tap{" "}
          <strong className="text-charcoal-800">Approve sign in</strong> in your
          inbox — this screen will continue automatically.
        </p>

        {approved ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm font-medium text-emerald-700">
              Approved — finishing sign-in…
            </p>
            <Button className="w-full" onClick={() => void finishSignIn(true)}>
              Continue to dashboard
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-600" />
            <p className="text-sm text-stone-400">Waiting for approval…</p>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}

        {process.env.NODE_ENV === "development" ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
              Dev only
            </p>
            <p className="mt-1 text-sm text-amber-900/80">
              Email goes to Mailpit on your PC. Simulate the inbox approve button
              below.
            </p>
            <Button
              className="mt-4 w-full"
              disabled={devLoading}
              onClick={() => void devApprove()}
            >
              {devLoading ? "Approving…" : "Approve sign in (dev)"}
            </Button>
            <Link
              href="http://localhost:8025"
              className="mt-3 block text-center text-xs font-medium text-amber-900 underline"
              target="_blank"
              rel="noreferrer"
            >
              Open Mailpit
            </Link>
          </div>
        ) : null}

        <Button className="mt-6" variant="secondary" onClick={onBack}>
          Use a different email
        </Button>
      </div>
    </main>
  );
}
