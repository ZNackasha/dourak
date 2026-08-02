import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { isScheduleAdmin } from "@/lib/permissions";
import { buildScheduleIcs } from "@/lib/ical";

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

  const events = await db.scheduleEvent.findMany({
    where: { scheduleId: id },
    include: { shifts: true },
    orderBy: [{ type: "asc" }, { start: "asc" }],
  });

  const ics = buildScheduleIcs(schedule.name, events);
  const slug =
    schedule.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "calendar";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
