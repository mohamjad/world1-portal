import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser, getGuideTrips } from "@/lib/dal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "My Trips",
};

export default async function GuideTripsPage() {
  const [user, trips] = await Promise.all([
    getCurrentUser(),
    getGuideTrips(),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">My Trips</h1>
      </div>
      <div className="space-y-6">
        {trips.length > 0 ? (
          trips.map((trip) => {
            const event: any = trip.events;
            // The typing from Supabase join might be nested or an array, depending on if it's 1-to-1 or 1-to-many
            // event_guides -> events is a many-to-1 relation, so events should be a single object.
            // event_participants should be an array.
            const participants = Array.isArray(event?.event_participants) 
              ? event.event_participants 
              : [];

            if (!event) return null;

            return (
              <article
                key={trip.id}
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
                
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-neutral-900">Trip Details</h3>
                    <dl className="grid grid-cols-1 gap-2 text-sm text-neutral-600">
                      <div>
                        <dt className="inline font-medium">Dates:</dt>{" "}
                        <dd className="inline">
                          {formatDate(event.start_date)}
                          {event.end_date && ` - ${formatDate(event.end_date)}`}
                        </dd>
                      </div>
                      {event.location && (
                        <div>
                          <dt className="inline font-medium">Location:</dt>{" "}
                          <dd className="inline">{event.location}</dd>
                        </div>
                      )}
                      {trip.responsibilities && (
                        <div className="mt-2">
                          <dt className="font-medium">My Responsibilities:</dt>
                          <dd className="mt-1 whitespace-pre-wrap">{trip.responsibilities}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-neutral-900">
                      Roster ({participants.length})
                    </h3>
                    {participants.length > 0 ? (
                      <ul className="divide-y divide-neutral-100 rounded border border-neutral-200">
                        {participants.map((p: { users?: { name: string | null; email: string; } | null }, i: number) => {
                          const participantUser: any = p.users || {};
                          return (
                            <li key={i} className="p-2 text-sm">
                              <div className="font-medium">{participantUser.name || "Unnamed"}</div>
                              <div className="text-neutral-500">{participantUser.email}</div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500">No participants registered yet.</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState>You have no assigned trips.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
