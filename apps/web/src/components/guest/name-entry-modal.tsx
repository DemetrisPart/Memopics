"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuestSession } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

type NameEntryModalProps = {
  slug: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (name: { firstName: string; lastName: string | null }) => void;
};

export function NameEntryModal({
  slug,
  open,
  onClose,
  onSuccess,
}: NameEntryModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      setError("First name is required");
      return;
    }

    setLoading(true);
    try {
      await createGuestSession(slug, {
        firstName: trimmedFirst,
        lastName: lastName.trim() || undefined,
      });
      onSuccess({
        firstName: trimmedFirst,
        lastName: lastName.trim() || null,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-entry-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory-50 shadow-hero"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gold-accent-line" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 transition-colors hover:bg-ivory-100 hover:text-charcoal-800"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="px-6 pb-6 pt-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-gold-100">
            <Sparkles className="size-5 text-gold-600" aria-hidden />
          </div>

          <h2
            id="name-entry-title"
            className="font-serif text-2xl leading-tight text-charcoal-900"
          >
            Welcome! What&apos;s your name?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            So the couple knows who shared these memories.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="First name"
              requiredMark
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              disabled={loading}
              placeholder="Maria"
            />
            <Input
              label="Last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              disabled={loading}
              placeholder="Papadopoulos"
            />

            {error ? (
              <div
                className="rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-600"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-stone-400">
              Your name is stored for this event only.
            </p>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="min-h-12 flex-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="min-h-12 flex-1" disabled={loading}>
                {loading ? "Saving…" : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
