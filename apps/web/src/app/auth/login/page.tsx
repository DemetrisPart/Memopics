"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register, requestMagicLink } from "@/lib/api/dashboard-client";
import { warmupAuthRoutes } from "@/lib/auth/warmup-verify-route";
import { ApiError } from "@/lib/api/types";

const VERIFY_STORAGE_KEY = "momeva_verification_token";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmedEmail = email.trim();
      const result =
        mode === "register"
          ? await register(trimmedEmail)
          : await requestMagicLink(trimmedEmail);

      sessionStorage.setItem(VERIFY_STORAGE_KEY, result.verificationToken);
      await warmupAuthRoutes();
      const params = new URLSearchParams({
        pollToken: result.pollToken,
        email: trimmedEmail,
      });
      router.push(`/auth/check-email?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-soft">
        <Link
          href="/"
          className="text-xs font-medium text-stone-400 hover:text-charcoal-800"
        >
          ← Momeva
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-charcoal-900">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          {mode === "login"
            ? "We’ll send an email — tap Approve to sign in."
            : "Start managing your event photos."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Sending…" : "Send approval email"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          {mode === "login" ? "New to Momeva?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-gold-700 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
