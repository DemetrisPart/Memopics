import Link from "next/link";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireAuth } from "@/lib/api/server-fetch";

export default async function CreateEventPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-dvh bg-ivory-50">
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-lg px-4 py-8 lg:px-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-stone-400 hover:text-charcoal-800"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-charcoal-900">
          Create event
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Set up your wedding or celebration page.
        </p>
        <div className="mt-6">
          <CreateEventForm />
        </div>
      </main>
    </div>
  );
}
