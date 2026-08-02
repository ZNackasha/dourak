import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import { ScheduleCalendarManager } from "@/components/schedule-calendar-manager";

export default async function ScheduleCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: scheduleId } = await params;

  if (!session?.user?.id) {
    return redirect(`/login?callbackUrl=/schedules/${scheduleId}/calendar`);
  }

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) return notFound();

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) return notFound();

  // The schedule calendar is the native event source. Google-linked schedules
  // pull events from Google instead, so there is no native calendar to edit.
  if (schedule.googleCalendarId) {
    return redirect(`/schedules/${scheduleId}`);
  }

  const events = await db.scheduleEvent.findMany({
    where: { scheduleId },
    include: { shifts: true },
    orderBy: [{ type: "asc" }, { weekday: "asc" }, { start: "asc" }],
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <a
            href={`/schedules/${scheduleId}`}
            className="hover:text-foreground transition-colors"
          >
            ← Back to Schedule
          </a>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Calendar
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Define the events for <strong>{schedule.name}</strong>. Each new plan
          copies the events that fall inside its date range — one-off events on
          their date, and recurring events on every matching day.
        </p>
      </div>

      <ScheduleCalendarManager scheduleId={scheduleId} events={events} />
    </div>
  );
}
