import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-semibold text-charcoal-900">Memopics</h1>
      <p className="mt-3 max-w-md text-stone-400">
        Collect wedding and event photos from your guests — beautifully and
        effortlessly.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/auth/login">
          <Button>Couple sign in</Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>
      <p className="mt-10 text-xs text-stone-400">
        Guest? Scan the QR code at your event — no account needed.
      </p>
    </main>
  );
}
