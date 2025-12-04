"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isScheduleAdmin } from "@/lib/permissions";

export async function addVolunteerAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const eventId = formData.get("eventId") as string;
  const email = formData.get("email") as string;
  const scheduleId = formData.get("scheduleId") as string;
  // const roleId = formData.get("roleId") as string; // Optional, ignoring for now to keep simple

  if (!eventId || !email) throw new Error("Missing fields");

  // Find or create Shift for this event
  // For now, let's assume one generic shift per event
  let shift = await db.shift.findFirst({
    where: {
      calendarEventId: eventId,
      roleId: null,
    },
  });

  if (!shift) {
    shift = await db.shift.create({
      data: {
        calendarEventId: eventId,
        roleId: null,
      },
    });
  }

  // Create Assignment
  await db.assignment.create({
    data: {
      shiftId: shift.id,
      email,
      status: "PENDING",
    },
  });

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function toggleAvailabilityAction(
  eventId: string,
  scheduleId: string,
  shiftId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;
  let targetShiftId = shiftId;

  // If no specific shift provided, find or create generic Shift
  if (!targetShiftId) {
    let shift = await db.shift.findFirst({
      where: {
        calendarEventId: eventId,
        roleId: null,
      },
    });

    if (!shift) {
      shift = await db.shift.create({
        data: {
          calendarEventId: eventId,
          roleId: null,
        },
      });
    }
    targetShiftId = shift.id;
  }

  // Check existing assignment
  const existing = await db.assignment.findFirst({
    where: {
      shiftId: targetShiftId,
      userId: userId,
    },
  });

  if (existing) {
    // If confirmed, maybe don't allow removing? For now, allow removing.
    await db.assignment.delete({
      where: { id: existing.id },
    });
  } else {
    // Verify role if shift has one
    if (shiftId) {
      const shift = await db.shift.findUnique({
        where: { id: shiftId },
        include: { role: true },
      });

      if (shift?.roleId) {
        const hasRole = await db.userRole.findUnique({
          where: {
            userId_roleId: {
              userId,
              roleId: shift.roleId,
            },
          },
        });
        if (!hasRole)
          throw new Error(
            "You do not have the required role for this position."
          );
      }
    }

    await db.assignment.create({
      data: {
        shiftId: targetShiftId,
        userId: userId,
        email: session.user.email,
        status: "AVAILABLE",
      },
    });
  }

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function confirmAssignmentAction(
  assignmentId: string,
  scheduleId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  await db.assignment.update({
    where: { id: assignmentId },
    data: { status: "CONFIRMED" },
  });

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function adminAssignVolunteerAction(
  shiftId: string,
  scheduleId: string,
  name: string,
  email?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  await db.assignment.create({
    data: {
      shiftId,
      name,
      email: email || null,
      status: "CONFIRMED", // Admin assignments are auto-confirmed
    },
  });

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

export async function volunteerForMultipleEventsAction(
  scheduleId: string,
  assignments: { eventId: string; shiftId?: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  for (const { eventId, shiftId } of assignments) {
    let targetShiftId = shiftId;

    // If no specific shift provided, find or create generic Shift
    if (!targetShiftId) {
      let shift = await db.shift.findFirst({
        where: {
          calendarEventId: eventId,
          roleId: null,
        },
      });

      if (!shift) {
        shift = await db.shift.create({
          data: {
            calendarEventId: eventId,
            roleId: null,
          },
        });
      }
      targetShiftId = shift.id;
    }

    // Check existing assignment
    const existing = await db.assignment.findFirst({
      where: {
        shiftId: targetShiftId,
        userId: userId,
      },
    });

    if (!existing) {
      // Verify role if shift has one
      if (shiftId) {
        const shift = await db.shift.findUnique({
          where: { id: shiftId },
          include: { role: true },
        });

        if (shift?.roleId) {
          const hasRole = await db.userRole.findUnique({
            where: {
              userId_roleId: {
                userId,
                roleId: shift.roleId,
              },
            },
          });
          // If user doesn't have role, skip this assignment instead of throwing
          if (!hasRole) continue;
        }
      }

      await db.assignment.create({
        data: {
          shiftId: targetShiftId,
          userId: userId,
          email: session.user.email,
          status: "AVAILABLE",
        },
      });
    }
  }

  revalidatePath(`/schedules/${scheduleId}/admin`);
  revalidatePath(`/schedules/${scheduleId}/view`);
}

