"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { listCalendars, listEvents } from "@/lib/google";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import nodemailer from "nodemailer";
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
        needed: shift.needed,
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

export async function deletePlanAction(planId: string, scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  await db.plan.delete({
    where: { id: planId },
  });

  revalidatePath(`/schedules/${scheduleId}`);
  redirect(`/schedules/${scheduleId}`);
}

export async function deleteScheduleAction(scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    await db.schedule.delete({
      where: { id: scheduleId },
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }

  revalidatePath("/schedules");
  redirect("/schedules");
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
  try {
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

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) throw new Error("Schedule not found");

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Fetch events FIRST before creating anything in DB
    // This prevents creating empty plans if Google API fails
    console.log(
      `Fetching Google events for schedule ${scheduleId} from ${startDate} to ${endDate}`
    );
    const googleEvents = await listEvents(
      session.user.id,
      schedule.googleCalendarId,
      startDate,
      endDate
    );
    console.log(`Fetched ${googleEvents.length} events from Google`);

    // Use a transaction to ensure atomicity
    const planId = await db.$transaction(async (tx) => {
      // Create Plan
      const plan = await tx.plan.create({
        data: {
          name,
          startDate,
          endDate,
          scheduleId,
          status: "DRAFT",
        },
      });

      // Prepare events
      const eventsToCreate = googleEvents.map((ev: any) => ({
        planId: plan.id,
        googleEventId: ev.id,
        title: ev.summary || "No Title",
        start: new Date(ev.start.dateTime || ev.start.date),
        end: new Date(ev.end.dateTime || ev.end.date),
        recurringEventId: ev.recurringEventId || null,
      }));

      if (eventsToCreate.length > 0) {
        await tx.calendarEvent.createMany({
          data: eventsToCreate,
        });

        // Apply RecurringShift templates
        const recurringIds = [
          ...new Set(
            eventsToCreate
              .map(
                (e: { recurringEventId: string | null }) => e.recurringEventId
              )
              .filter((id: string | null): id is string => !!id)
          ),
        ] as string[];

        if (recurringIds.length > 0) {
          const templates = await tx.recurringShift.findMany({
            where: {
              scheduleId: scheduleId,
              recurringEventId: { in: recurringIds },
            },
          });

          if (templates.length > 0) {
            // We need to fetch the created events to get their IDs
            // Since createMany doesn't return IDs, we have to query them back
            // We can match by planId and recurringEventId
            const createdEvents = await tx.calendarEvent.findMany({
              where: {
                planId: plan.id,
                recurringEventId: { in: recurringIds },
              },
              select: { id: true, recurringEventId: true },
            });

            const shiftsToCreate = [];
            for (const event of createdEvents) {
              if (!event.recurringEventId) continue;
              const eventTemplates = templates.filter(
                (t: { recurringEventId: string }) =>
                  t.recurringEventId === event.recurringEventId
              );
              for (const template of eventTemplates) {
                shiftsToCreate.push({
                  calendarEventId: event.id,
                  roleId: template.roleId,
                  needed: template.needed,
                  name: template.name,
                });
              }
            }

            if (shiftsToCreate.length > 0) {
              await tx.shift.createMany({
                data: shiftsToCreate,
              });
            }
          }
        }
      }
      return plan.id;
    });

    revalidatePath(`/schedules/${scheduleId}`);
    redirect(`/schedules/${scheduleId}/plans/${planId}`);
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error; // Re-throw to trigger error boundary or show error to user
  }
}

export async function addShiftAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const eventId = formData.get("eventId") as string;
  const roleIdInput = formData.get("roleId") as string;
  const newRoleName = formData.get("newRoleName") as string;
  // If roleId is "__NEW__", treat it as null so we create a new role
  let roleId = roleIdInput && roleIdInput !== "__NEW__" ? roleIdInput : null;
  const scheduleId = formData.get("scheduleId") as string;
  const needed = parseInt(formData.get("needed") as string) || 1;

  console.log("addShiftAction called with:", {
    eventId,
    roleId,
    newRoleName,
    scheduleId,
    needed,
  });

  if (!eventId || !scheduleId) {
    console.error("Missing fields in addShiftAction");
    throw new Error("Missing fields");
  }

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // Handle new role creation
  if (!roleId && newRoleName) {
    const existingRole = await db.role.findFirst({
      where: {
        scheduleId,
        name: newRoleName.trim(),
      },
    });

    if (existingRole) {
      roleId = existingRole.id;
    } else {
      const newRole = await db.role.create({
        data: {
          name: newRoleName.trim(),
          scheduleId,
          type: "required",
          inviteToken: crypto.randomUUID(),
          color: "#6366f1", // Default indigo
        },
      });
      roleId = newRole.id;
    }
  }

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
        needed: needed,
      })),
    });
  }

  // Update RecurringShift template if it's a recurring event
  if (targetEvent.recurringEventId) {
    // We use deleteMany + create instead of upsert to handle potential null roleId issues cleanly
    // and ensure we overwrite the configuration
    await db.recurringShift.deleteMany({
      where: {
        scheduleId,
        recurringEventId: targetEvent.recurringEventId,
        roleId: roleId,
      },
    });

    await db.recurringShift.create({
      data: {
        scheduleId,
        recurringEventId: targetEvent.recurringEventId,
        roleId: roleId,
        needed: needed,
      },
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

    // Remove RecurringShift template
    await db.recurringShift.deleteMany({
      where: {
        scheduleId,
        recurringEventId: calendarEvent.recurringEventId,
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
  data: { name?: string; needed?: number }
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
        ...(data.name !== undefined && { name: data.name }),
        ...(data.needed !== undefined && { needed: data.needed }),
      },
    });

    // Update RecurringShift template
    await db.recurringShift.updateMany({
      where: {
        scheduleId,
        recurringEventId: calendarEvent.recurringEventId,
        roleId: roleId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.needed !== undefined && { needed: data.needed }),
      },
    });
  } else {
    await db.shift.update({
      where: { id: shiftId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.needed !== undefined && { needed: data.needed }),
      },
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
    await sendPublishNotifications(planId);
  }

  revalidatePath(`/schedules/${scheduleId}`);
}

async function sendPublishNotifications(planId: string) {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: { schedule: true },
  });
  if (!plan) return;

  const assignments = await db.assignment.findMany({
    where: {
      shift: {
        calendarEvent: {
          planId: planId,
        },
      },
    },
    include: {
      user: true,
      shift: {
        include: {
          calendarEvent: true,
          role: true,
        },
      },
    },
  });

  const emailGroups: Record<string, typeof assignments> = {};

  for (const assignment of assignments) {
    const email = assignment.user?.email || assignment.email;
    if (!email) continue;

    if (!emailGroups[email]) {
      emailGroups[email] = [];
    }
    emailGroups[email].push(assignment);
  }

  const from = process.env.EMAIL_FROM || "noreply@dourak.app";
  let transporter: nodemailer.Transporter;

  if (process.env.EMAIL_SERVER) {
    transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
  } else {
    // Mock transporter for dev
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  for (const [email, userAssignments] of Object.entries(emailGroups)) {
    const assignmentList = userAssignments
      .map((a) => {
        const date = a.shift.calendarEvent.start.toLocaleDateString();
        const time = a.shift.calendarEvent.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const role = a.shift.role?.name || a.shift.name || "Volunteer";
        const eventTitle = a.shift.calendarEvent.title;
        return `- ${date} at ${time}: ${role} (${eventTitle})`;
      })
      .join("\n");

    const text = `Hello,\n\nYou have been scheduled for the following shifts in ${plan.name}:\n\n${assignmentList}\n\nPlease log in to Dourak to confirm your assignments.\n\nBest,\nDourak Team`;

    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject: `New Schedule: ${plan.name}`,
        text,
      });

      if (!process.env.EMAIL_SERVER) {
        console.log("----------------------------------------------");
        console.log(`Email to ${email}:`);
        console.log(text);
        console.log("----------------------------------------------");
      }
    } catch (e) {
      console.error(`Failed to send email to ${email}`, e);
    }
  }
}

export async function syncScheduleEventsAction(scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Schedule not found");

  // 1. Find all non-completed plans
  const plans = await db.plan.findMany({
    where: {
      scheduleId,
      status: { not: "COMPLETED" },
    },
  });

  for (const plan of plans) {
    // 2. Fetch events from Google Calendar
    const googleEvents = await listEvents(
      session.user.id,
      schedule.googleCalendarId,
      plan.startDate,
      plan.endDate
    );

    // 3. Fetch existing events from DB
    const dbEvents = await db.calendarEvent.findMany({
      where: { planId: plan.id },
    });

    const dbEventMap = new Map(dbEvents.map((e) => [e.googleEventId, e]));
    const googleEventIds = new Set(googleEvents.map((e: any) => e.id));

    // 4. Identify events to add
    const eventsToAdd = googleEvents.filter((e: any) => !dbEventMap.has(e.id));

    // 5. Identify events to remove
    const eventsToRemove = dbEvents.filter(
      (e) => !googleEventIds.has(e.googleEventId)
    );

    // 6. Remove events
    if (eventsToRemove.length > 0) {
      await db.calendarEvent.deleteMany({
        where: {
          id: { in: eventsToRemove.map((e) => e.id) },
        },
      });
    }

    // 7. Add events
    if (eventsToAdd.length > 0) {
      const eventsToCreate = eventsToAdd.map((ev: any) => ({
        planId: plan.id,
        googleEventId: ev.id,
        title: ev.summary || "No Title",
        start: new Date(ev.start.dateTime || ev.start.date),
        end: new Date(ev.end.dateTime || ev.end.date),
        recurringEventId: ev.recurringEventId || null,
      }));

      await db.calendarEvent.createMany({
        data: eventsToCreate,
      });

      // Apply RecurringShift templates for newly created events
      const recurringIds = [
        ...new Set(
          eventsToCreate
            .map((e: { recurringEventId: string | null }) => e.recurringEventId)
            .filter((id: string | null): id is string => !!id)
        ),
      ] as string[];

      if (recurringIds.length > 0) {
        const templates = await db.recurringShift.findMany({
          where: {
            scheduleId: scheduleId,
            recurringEventId: { in: recurringIds },
          },
        });

        if (templates.length > 0) {
          // Fetch the newly created events to get their IDs
          const createdEvents = await db.calendarEvent.findMany({
            where: {
              planId: plan.id,
              recurringEventId: { in: recurringIds },
              // Ensure we only get the ones we just added (or at least ones that match the google IDs we added)
              googleEventId: { in: eventsToAdd.map((e: any) => e.id) },
            },
            select: { id: true, recurringEventId: true },
          });

          const shiftsToCreate = [];
          for (const event of createdEvents) {
            if (!event.recurringEventId) continue;
            const eventTemplates = templates.filter(
              (t: { recurringEventId: string }) =>
                t.recurringEventId === event.recurringEventId
            );
            for (const template of eventTemplates) {
              shiftsToCreate.push({
                calendarEventId: event.id,
                roleId: template.roleId,
                needed: template.needed,
                name: template.name,
              });
            }
          }

          if (shiftsToCreate.length > 0) {
            await db.shift.createMany({
              data: shiftsToCreate,
            });
          }
        }
      }
    }
  }

  revalidatePath(`/schedules/${scheduleId}`);
}

