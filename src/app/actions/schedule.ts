"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { listCalendars, listEvents } from "@/lib/google";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export async function getCalendarsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return listCalendars(session.user.id);
}

export async function createScheduleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const calendarId = formData.get("calendarId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!name || !calendarId || !startDateStr || !endDateStr) {
    throw new Error("Missing fields");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Create Schedule
  const schedule = await db.schedule.create({
    data: {
      name,
      googleCalendarId: calendarId,
      startDate,
      endDate,
      userId: session.user.id,
    },
  });

  // Fetch events
  const googleEvents = await listEvents(
    session.user.id,
    calendarId,
    startDate,
    endDate
  );

  // Save events
  // We need to map Google Event to our CalendarEvent
  // Google Event structure: { id, summary, start: { dateTime }, end: { dateTime }, recurringEventId }

  const eventsToCreate = googleEvents.map((ev: any) => ({
    scheduleId: schedule.id,
    googleEventId: ev.id,
    title: ev.summary || "No Title",
    start: new Date(ev.start.dateTime || ev.start.date), // Handle all-day events too?
    end: new Date(ev.end.dateTime || ev.end.date),
    recurringEventId: ev.recurringEventId || null,
  }));

  if (eventsToCreate.length > 0) {
    await db.calendarEvent.createMany({
      data: eventsToCreate,
    });
  }

  revalidatePath("/schedules");
  redirect(`/schedules/${schedule.id}/admin`);
}

export async function addShiftAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const eventId = formData.get("eventId") as string;
  const roleId = formData.get("roleId") as string;
  const scheduleId = formData.get("scheduleId") as string;

  console.log("addShiftAction called with:", { eventId, roleId, scheduleId });

  if (!eventId || !roleId || !scheduleId) {
    console.error("Missing fields in addShiftAction");
    throw new Error("Missing fields");
  }

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // 1. Fetch the target event to check for recurring info
  // @ts-ignore
  const targetEvent = await db.calendarEvent.findUnique({
    where: { id: eventId },
    select: { id: true, recurringEventId: true, scheduleId: true },
  });

  if (!targetEvent) throw new Error("Event not found");

  let targetEventIds = [targetEvent.id];

  // 2. If it's a recurring event, find all siblings in the same schedule
  if (targetEvent.recurringEventId) {
    // @ts-ignore
    const siblingEvents = await db.calendarEvent.findMany({
      where: {
        scheduleId: targetEvent.scheduleId,
        recurringEventId: targetEvent.recurringEventId,
      },
      select: { id: true },
    });
    targetEventIds = siblingEvents.map((e: { id: string }) => e.id);
  }

  // 3. Find which events already have this role assigned
  // @ts-ignore
  const existingShifts = await db.shift.findMany({
    where: {
      calendarEventId: { in: targetEventIds },
      roleId: roleId,
    },
    select: { calendarEventId: true },
  });

  const existingEventIds = new Set(
    existingShifts.map((s: { calendarEventId: string }) => s.calendarEventId)
  );

  // 4. Filter out events that already have the role
  const eventsToCreateFor = targetEventIds.filter(
    (id) => !existingEventIds.has(id)
  );

  if (eventsToCreateFor.length > 0) {
    // @ts-ignore
    await db.shift.createMany({
      data: eventsToCreateFor.map((id) => ({
        calendarEventId: id,
        roleId: roleId,
      })),
    });
  }

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function removeShiftAction(shiftId: string, scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // 1. Fetch the shift to get role and event info
  // @ts-ignore
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      calendarEvent: {
        select: {
          id: true,
          recurringEventId: true,
          scheduleId: true,
        },
      },
    },
  });

  if (!shift) throw new Error("Shift not found");

  const { calendarEvent, roleId } = shift;

  // 2. If it's a recurring event, find all matching shifts in the series
  if (calendarEvent.recurringEventId && roleId) {
    // Find all sibling events
    // @ts-ignore
    const siblingEvents = await db.calendarEvent.findMany({
      where: {
        scheduleId: calendarEvent.scheduleId,
        recurringEventId: calendarEvent.recurringEventId,
      },
      select: { id: true },
    });

    const siblingEventIds = siblingEvents.map((e: { id: string }) => e.id);

    // Delete shifts with same role in these events
    // @ts-ignore
    await db.shift.deleteMany({
      where: {
        calendarEventId: { in: siblingEventIds },
        roleId: roleId,
      },
    });
  } else {
    // Just delete this single shift
    // @ts-ignore
    await db.shift.delete({
      where: { id: shiftId },
    });
  }

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function updateShiftAction(
  shiftId: string,
  scheduleId: string,
  newName: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // @ts-ignore
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      calendarEvent: {
        select: {
          id: true,
          recurringEventId: true,
          scheduleId: true,
        },
      },
    },
  });

  if (!shift) throw new Error("Shift not found");

  const { calendarEvent, roleId } = shift;

  if (calendarEvent.recurringEventId && roleId) {
    // Find all sibling events
    // @ts-ignore
    const siblingEvents = await db.calendarEvent.findMany({
      where: {
        scheduleId: calendarEvent.scheduleId,
        recurringEventId: calendarEvent.recurringEventId,
      },
      select: { id: true },
    });

    const siblingEventIds = siblingEvents.map((e: { id: string }) => e.id);

    // Update all shifts with the same role in the series
    // @ts-ignore
    await db.shift.updateMany({
      where: {
        calendarEventId: { in: siblingEventIds },
        roleId: roleId,
      },
      data: {
        name: newName,
      },
    });
  } else {
    // @ts-ignore
    await db.shift.update({
      where: { id: shiftId },
      data: { name: newName },
    });
  }

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

