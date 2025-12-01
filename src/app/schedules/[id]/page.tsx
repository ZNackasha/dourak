import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { EventCard } from "@/components/event-card";
import { notFound } from "next/navigation";

export default async function ScheduleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return <div>Please login</div>;

  const { id } = await params;

  const schedule = await db.schedule.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { start: "asc" },
        include: {
          shifts: {
            include: {
              assignments: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!schedule) return notFound();

  const isOwner = schedule.userId === session.user.id;

  // Fetch user's roles
  const userRoles = await db.userRole.findMany({
    where: { userId: session.user.id },
    select: { roleId: true },
  });
  const userRoleIds = userRoles.map((ur) => ur.roleId);

  // Fetch all roles for owner to assign
  const allRoles = isOwner ? await db.role.findMany({ orderBy: { name: "asc" } }) : [];

  // Group events by date
  const eventsByDate = schedule.events.reduce((acc, event) => {
    const dateKey = event.start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof schedule.events>);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{schedule.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-zinc-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {schedule.startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })} - {schedule.endDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>
        {isOwner && (
          <a
            href="/roles"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Roles
          </a>
        )}
      </div>

      <div className="space-y-10">
        {Object.entries(eventsByDate).map(([date, events]) => (
          <div key={date} className="relative">
            <div className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-sm py-3 mb-4 border-b border-zinc-200/50">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {date}
              </h2>
            </div>
            <div className="grid gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  scheduleId={schedule.id}
                  isOwner={isOwner}
                  currentUserId={session.user.id!}
                  userRoleIds={userRoleIds}
                  allRoles={allRoles}
                />
              ))}
            </div>
          </div>
        ))}
        {schedule.events.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-zinc-200">
            <p className="text-zinc-500">No events found in this schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}
