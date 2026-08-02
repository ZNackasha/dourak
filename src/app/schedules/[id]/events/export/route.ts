import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { isScheduleAdmin } from "@/lib/permissions";
import { buildScheduleIcs, type IcsEventInput } from "@/lib/ical";

// Exports every concrete event across all of a schedule's plans as an .ics
// file. Works for any schedule type — in particular it gives Google-linked
// schedules (which have no native calendar editor) a way to export.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const schedule = await db.schedule.findUnique({ where: { id } });
  if (!schedule) return new Response("Not found", { status: 404 });

  const events = await db.calendarEvent.findMany({
    where: { plan: { scheduleId: id } },
    include: { shifts: true },
    orderBy: { start: "asc" },
  });

  const mapped: IcsEventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: "ONE_OFF",
    start: e.start,
    end: e.end,
    rrule: null,
    weekday: null,
    startTime: null,
    endTime: null,
    shifts: e.shifts,
  }));

  const ics = buildScheduleIcs(schedule.name, mapped);
  const slug =
    schedule.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "calendar";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-events.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
