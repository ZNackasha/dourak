"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { listCalendars, listEvents } from "@/lib/google";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import {
  generateSchedule,
  SchedulerEvent,
  SchedulerUser,
} from "@/lib/scheduler";

export async function autoScheduleAction(planId: string, scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // 1. Fetch all shifts for the plan
  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      events: {
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

  if (!plan) throw new Error("Plan not found");

  // 2. Fetch all users with roles or availability
  const usersWithRoles = await db.user.findMany({
    where: {
      OR: [
        {
          roles: {
            some: {
              role: {
                scheduleId: scheduleId,
              },
            },
          },
        },
        {
          availabilities: {
            some: {
              shift: {
                calendarEvent: {
                  planId: planId,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      roles: {
        where: {
          role: {
            scheduleId: scheduleId,
          },
        },
        include: {
          role: true,
        },
      },
      availabilities: {
        where: {
          shift: {
            calendarEvent: {
              planId: planId,
            },
          },
        },
      },
    },
  });

  // 3. Map to Scheduler types
  const schedulerEvents: SchedulerEvent[] = [];

  for (const event of plan.events) {
    for (const shift of event.shifts) {
      schedulerEvents.push({
        id: shift.id,
        roleId: shift.roleId,
        start: event.start,
        end: event.end,
        assignments: shift.assignments.map((a) => ({
          userId: a.userId,
          status: a.status,
        })),
      });
    }
  }

  const schedulerUsers: SchedulerUser[] = usersWithRoles.map((u) => ({
    id: u.id,
    roles: u.roles.map((ur) => ({
      roleId: ur.roleId,
      type: ur.type as "required" | "optional",
    })),
    availableEvents: u.availabilities.map((a) => a.shiftId),
  }));

  // 4. Run the scheduler
  const results = generateSchedule(schedulerEvents, schedulerUsers);

  // 5. Save assignments
  if (results.length > 0) {
    await db.assignment.createMany({
      data: results.map((r) => ({
        shiftId: r.eventId, // mapped from shift.id
        userId: r.userId,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(`/schedules/${scheduleId}`);
  return { count: results.length };
}

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

  if (!name || !calendarId) {
    throw new Error("Missing fields");
  }

  // Create Schedule
  const schedule = await db.schedule.create({
    data: {
      name,
      googleCalendarId: calendarId,
      userId: session.user.id,
    },
  });

  revalidatePath("/schedules");
  redirect(`/schedules/${schedule.id}`);
}

export async function createPlanAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const scheduleId = formData.get("scheduleId") as string;
  const name = formData.get("name") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!scheduleId || !name || !startDateStr || !endDateStr) {
    throw new Error("Missing fields");
  }

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Schedule not found");

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Create Plan
  const plan = await db.plan.create({
    data: {
      name,
      startDate,
      endDate,
      scheduleId,
      status: "DRAFT",
    },
  });

  // Fetch events
  const googleEvents = await listEvents(
    session.user.id,
    schedule.googleCalendarId,
    startDate,
    endDate
  );

  // Save events
  const eventsToCreate = googleEvents.map((ev: any) => ({
    planId: plan.id,
    googleEventId: ev.id,
    title: ev.summary || "No Title",
    start: new Date(ev.start.dateTime || ev.start.date),
    end: new Date(ev.end.dateTime || ev.end.date),
    recurringEventId: ev.recurringEventId || null,
  }));

  if (eventsToCreate.length > 0) {
    await db.calendarEvent.createMany({
      data: eventsToCreate,
    });
  }

  revalidatePath(`/schedules/${scheduleId}`);
  redirect(`/schedules/${scheduleId}/plans/${plan.id}`);
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
  const targetEvent = await db.calendarEvent.findUnique({
    where: { id: eventId },
    select: { id: true, recurringEventId: true, planId: true },
  });

  if (!targetEvent) throw new Error("Event not found");

  let targetEventIds = [targetEvent.id];

  // 2. If it's a recurring event, find all siblings in the same plan
  if (targetEvent.recurringEventId) {
    const siblingEvents = await db.calendarEvent.findMany({
      where: {
        planId: targetEvent.planId,
        recurringEventId: targetEvent.recurringEventId,
      },
      select: { id: true },
    });
    targetEventIds = siblingEvents.map((e: { id: string }) => e.id);
  }

  // 3. Find which events already have this role assigned
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
    await db.shift.createMany({
      data: eventsToCreateFor.map((id) => ({
        calendarEventId: id,
        roleId: roleId,
      })),
    });
  }

  revalidatePath(`/schedules/${scheduleId}`);
}

export async function removeShiftAction(shiftId: string, scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // 1. Fetch the shift to get role and event info
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      calendarEvent: {
        select: {
          id: true,
          recurringEventId: true,
          planId: true,
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
        planId: calendarEvent.planId,
        recurringEventId: calendarEvent.recurringEventId,
      },
      select: { id: true },
    });

    const siblingEventIds = siblingEvents.map((e: { id: string }) => e.id);

    // Delete shifts with same role in these events
    await db.shift.deleteMany({
      where: {
        calendarEventId: { in: siblingEventIds },
        roleId: roleId,
      },
    });
  } else {
    // Just delete this single shift
    await db.shift.delete({
      where: { id: shiftId },
    });
  }

  revalidatePath(`/schedules/${scheduleId}`);
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

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      calendarEvent: {
        select: {
          id: true,
          recurringEventId: true,
          planId: true,
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
        planId: calendarEvent.planId,
        recurringEventId: calendarEvent.recurringEventId,
      },
      select: { id: true },
    });

    const siblingEventIds = siblingEvents.map((e: { id: string }) => e.id);

    // Update all shifts with the same role in the series
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
    await db.shift.update({
      where: { id: shiftId },
      data: { name: newName },
    });
  }

  revalidatePath(`/schedules/${scheduleId}`);
}

export async function updatePlanStatusAction(
  planId: string,
  scheduleId: string,
  status: "DRAFT" | "OPEN" | "PUBLISHED" | "COMPLETED"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  await db.plan.update({
    where: { id: planId },
    data: { status },
  });

  if (status === "PUBLISHED") {
    await autoScheduleAction(planId, scheduleId);
  }

  revalidatePath(`/schedules/${scheduleId}`);
}

