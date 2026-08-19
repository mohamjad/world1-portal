import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser, getEvents } from "@/lib/dal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const [user, events] = await Promise.all([getCurrentUser(), getEvents()]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Events</h1>
      </div>
      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <article
              key={event.id}
              className="border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{event.title}</h2>
                  {event.description && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {event.description}
                    </p>
                  )}
                </div>
                <StatusPill value={event.status} />
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">Dates</dt>
                  <dd>
                    {formatDate(event.start_date)}
                    {event.end_date && ` - ${formatDate(event.end_date)}`}
                  </dd>
                </div>
                {event.location && (
                  <div>
                    <dt className="text-neutral-500">Location</dt>
                    <dd>{event.location}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))
        ) : (
          <EmptyState>No upcoming events.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
