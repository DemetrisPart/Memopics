"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MagicLinkWaiting } from "@/components/auth/magic-link-waiting";
import { saveRememberedEmail } from "@/lib/auth/remembered-email";
import { warmupAuthRoutes } from "@/lib/auth/warmup-verify-route";

const VERIFY_STORAGE_KEY = "momeva_verification_token";

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollToken = searchParams.get("pollToken")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  useEffect(() => {
    void warmupAuthRoutes();
  }, []);

  useEffect(() => {
    if (email) saveRememberedEmail(email);
  }, [email]);

  useEffect(() => {
    const stored = sessionStorage.getItem(VERIFY_STORAGE_KEY);
    if (stored) {
      setVerificationToken(stored);
      return;
    }
    router.replace("/auth/login?error=session");
  }, [router]);

  if (!pollToken || !email || !verificationToken) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    );
  }

  return (
    <MagicLinkWaiting
      email={email}
      pollToken={pollToken}
      verificationToken={verificationToken}
      onBack={() => {
        sessionStorage.removeItem(VERIFY_STORAGE_KEY);
        router.push("/auth/login");
      }}
    />
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm text-stone-400">Loading…</p>
          </div>
        </main>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
