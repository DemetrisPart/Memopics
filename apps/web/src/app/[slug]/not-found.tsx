import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ivory-50 px-6 text-center">
      <h1 className="font-serif text-3xl text-charcoal-900">Event not found</h1>
      <p className="mt-3 max-w-sm text-stone-400">
        This event gallery may have closed or the link may be incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-gold-600 px-6 text-ivory-50 hover:bg-gold-700"
      >
        Go home
      </Link>
    </main>
  );
}
