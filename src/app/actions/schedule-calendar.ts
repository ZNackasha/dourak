"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isScheduleAdmin } from "@/lib/permissions";
import { RRule } from "rrule";
import { parseScheduleIcs } from "@/lib/ical";

// ---------------------------------------------------------------------------
// Schedule-level "calendar": reusable events defined once on a schedule.
// Plans materialize (copy) these into concrete CalendarEvents at creation.
//
// One-off events store a single start/end. Recurring events store the FIRST
// occurrence in start/end (fixing the wall-clock time + duration) plus an iCal
// RRULE string describing how they repeat (RFC 5545) — the same model Google
// Calendar / iCal uses, so every repeat pattern is supported.
// ---------------------------------------------------------------------------

export async function createScheduleEventAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const scheduleId = formData.get("scheduleId") as string;
  const title = (formData.get("title") as string)?.trim();
  const type =
    (formData.get("type") as string) === "RECURRING" ? "RECURRING" : "ONE_OFF";
  const needed = parseInt(formData.get("needed") as string) || 1;

  if (!scheduleId || !title) throw new Error("Missing required fields");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const startStr = formData.get("start") as string;
  const endStr = formData.get("end") as string;
  if (!startStr || !endStr) throw new Error("Start and end are required");
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid start/end time");
  }

  let rrule: string | null = null;
  if (type === "RECURRING") {
    rrule = (formData.get("rrule") as string)?.trim() || null;
    if (!rrule)
      throw new Error("A repeat rule is required for recurring events");
    try {
      RRule.parseString(rrule);
    } catch {
      throw new Error("Invalid repeat rule");
    }
  }

  await db.scheduleEvent.create({
    data: {
      scheduleId,
      title,
      type,
      start,
      end,
      rrule,
      shifts: { create: [{ roleId: null, needed, name: null }] },
    },
  });

  revalidatePath(`/schedules/${scheduleId}/calendar`);
}

export async function deleteScheduleEventAction(
  eventId: string,
  scheduleId: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const event = await db.scheduleEvent.findFirst({
    where: { id: eventId, scheduleId },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found");

  await db.scheduleEvent.delete({ where: { id: eventId } });

  revalidatePath(`/schedules/${scheduleId}/calendar`);
}

// Import events from an uploaded iCalendar (.ics) file. Adds new events to the
// schedule's calendar (does not delete existing ones).
export async function importCalendarAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const scheduleId = formData.get("scheduleId") as string;
  if (!scheduleId) throw new Error("Missing schedule");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File is too large (max 2 MB)");
  }

  const text = await file.text();

  let parsed;
  try {
    parsed = parseScheduleIcs(text);
  } catch {
    throw new Error("Could not read that file — is it a valid .ics calendar?");
  }
  if (parsed.length === 0) {
    throw new Error("No events found in that calendar file");
  }

  let imported = 0;
  for (const ev of parsed) {
    let rrule = ev.rrule;
    let type = ev.type;
    if (rrule) {
      try {
        RRule.parseString(rrule);
      } catch {
        rrule = null;
        type = "ONE_OFF";
      }
    }
    const end =
      ev.end > ev.start ? ev.end : new Date(ev.start.getTime() + 3600000);

    await db.scheduleEvent.create({
      data: {
        scheduleId,
        title: ev.title || "Untitled event",
        type,
        start: ev.start,
        end,
        rrule,
        shifts: {
          create: [
            { roleId: null, needed: Math.max(1, ev.needed), name: null },
          ],
        },
      },
    });
    imported++;
  }

  revalidatePath(`/schedules/${scheduleId}/calendar`);
  return { count: imported };
}

// ---------------------------------------------------------------------------
// Materialization: copy a schedule's calendar into a plan's date range.
// Called from createPlanAction. Plans are snapshots — later edits to the
// schedule calendar do not affect already-created plans.
// ---------------------------------------------------------------------------

type MaterializedShift = {
  roleId: string | null;
  needed: number;
  name: string | null;
  required: boolean;
};
type Materialized = {
  title: string;
  start: Date;
  end: Date;
  shifts: MaterializedShift[];
};

type RecurringSource = {
  title: string;
  start: Date | null;
  end: Date | null;
  rrule: string | null;
  // Legacy simple-weekly fields (pre-RRULE events).
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  shifts: MaterializedShift[];
};

// Treat wall-clock times as "floating": build a UTC instant from the local
// calendar components so DST shifts never move an event off its intended time.
function toFloatingUTC(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      0,
    ),
  );
}

function fromFloatingUTC(d: Date): Date {
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    0,
  );
}

function expandRecurring(
  event: RecurringSource,
  rangeStart: Date,
  rangeEnd: Date,
): Materialized[] {
  // RRULE-based recurrence (full Google-Calendar-style support).
  if (event.rrule && event.start && event.end) {
    const durationMs = event.end.getTime() - event.start.getTime();

    const options = RRule.parseString(event.rrule);
    options.dtstart = toFloatingUTC(event.start);
    const rule = new RRule(options);

    const winStart = new Date(
      Date.UTC(
        rangeStart.getFullYear(),
        rangeStart.getMonth(),
        rangeStart.getDate(),
        0,
        0,
        0,
      ),
    );
    const winEnd = new Date(
      Date.UTC(
        rangeEnd.getFullYear(),
        rangeEnd.getMonth(),
        rangeEnd.getDate(),
        23,
        59,
        59,
      ),
    );

    return rule.between(winStart, winEnd, true).map((occ) => {
      const start = fromFloatingUTC(occ);
      return {
        title: event.title,
        start,
        end: new Date(start.getTime() + durationMs),
        shifts: event.shifts,
      };
    });
  }

  // Legacy weekly recurrence (events created before RRULE support).
  if (event.weekday != null && event.startTime && event.endTime) {
    const out: Materialized[] = [];
    const [sh, sm] = event.startTime.split(":").map(Number);
    const [eh, em] = event.endTime.split(":").map(Number);
    const cursor = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      rangeStart.getDate(),
    );
    const last = new Date(
      rangeEnd.getFullYear(),
      rangeEnd.getMonth(),
      rangeEnd.getDate(),
    );
    while (cursor <= last) {
      if (cursor.getDay() === event.weekday) {
        out.push({
          title: event.title,
          start: new Date(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
            sh,
            sm,
          ),
          end: new Date(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
            eh,
            em,
          ),
          shifts: event.shifts,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  return [];
}

export async function materializeScheduleEventsIntoPlan(
  planId: string,
  scheduleId: string,
  startDate: Date,
  endDate: Date,
) {
  const scheduleEvents = await db.scheduleEvent.findMany({
    where: { scheduleId },
    include: { shifts: true },
  });

  const occurrences: Materialized[] = [];

  for (const se of scheduleEvents) {
    const shifts: MaterializedShift[] = se.shifts.map((s) => ({
      roleId: s.roleId,
      needed: s.needed,
      name: s.name,
      required: s.required,
    }));

    if (se.type === "ONE_OFF") {
      if (se.start && se.start >= startDate && se.start <= endDate) {
        occurrences.push({
          title: se.title,
          start: se.start,
          end: se.end ?? se.start,
          shifts,
        });
      }
    } else {
      occurrences.push(
        ...expandRecurring({ ...se, shifts }, startDate, endDate),
      );
    }
  }

  for (const ev of occurrences) {
    await db.calendarEvent.create({
      data: {
        planId,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        shifts: {
          create: ev.shifts.map((s) => ({
            roleId: s.roleId,
            needed: s.needed,
            name: s.name,
            required: s.required,
          })),
        },
      },
    });
  }

  return occurrences.length;
}

