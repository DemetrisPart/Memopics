"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkSlugAvailability,
  createEvent,
  register,
  requestMagicLink,
} from "@/lib/api/dashboard-client";
import { ApiError } from "@/lib/api/types";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await register(email.trim());
      } else {
        await requestMagicLink(email.trim());
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-charcoal-900">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-stone-400">
            We sent a magic link to <strong className="text-charcoal-800">{email}</strong>.
            Click the link to sign in.
          </p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-soft">
        <Link
          href="/"
          className="text-xs font-medium text-stone-400 hover:text-charcoal-800"
        >
          ← Memopics
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-charcoal-900">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          {mode === "login"
            ? "We’ll email you a secure sign-in link."
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
            {loading ? "Sending…" : "Send magic link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          {mode === "login" ? "New to Memopics?" : "Already have an account?"}{" "}
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
