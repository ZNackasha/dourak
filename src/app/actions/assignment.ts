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

  revalidatePath(`/schedules/${scheduleId}`, "layout");
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

  // Check existing availability
  const existingAvailability = await db.availability.findUnique({
    where: {
      shiftId_userId: {
        shiftId: targetShiftId,
        userId: userId,
      },
    },
  });

  // Check existing assignment
  const existingAssignment = await db.assignment.findUnique({
    where: {
      shiftId_userId: {
        shiftId: targetShiftId,
        userId: userId,
      },
    },
  });

  if (existingAvailability || existingAssignment) {
    // Remove availability if exists
    if (existingAvailability) {
      await db.availability.delete({
        where: { id: existingAvailability.id },
      });
    }

    // Remove assignment if exists
    if (existingAssignment) {
      await db.assignment.delete({
        where: { id: existingAssignment.id },
      });
    }
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

        const isAdmin = await isScheduleAdmin(scheduleId, userId);

        if (!hasRole && !isAdmin)
          throw new Error(
            "You do not have the required role for this position."
          );
      }
    }

    await db.availability.create({
      data: {
        shiftId: targetShiftId,
        userId: userId,
      },
    });
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
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

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw new Error("Assignment not found");

  if (assignment.userId) {
    await db.assignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED" },
    });
  } else {
    await db.assignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED" },
    });
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function unconfirmAssignmentAction(
  assignmentId: string,
  scheduleId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) throw new Error("Assignment not found");

  // If user is assigned, move back to availability
  if (assignment.userId) {
    await db.availability.upsert({
      where: {
        shiftId_userId: {
          shiftId: assignment.shiftId,
          userId: assignment.userId,
        },
      },
      create: {
        shiftId: assignment.shiftId,
        userId: assignment.userId,
      },
      update: {},
    });
  }

  await db.assignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function assignVolunteerAction(
  shiftId: string,
  userId: string,
  scheduleId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // Create or Update Assignment
  await db.assignment.upsert({
    where: {
      shiftId_userId: {
        shiftId: shiftId,
        userId,
      },
    },
    create: {
      shiftId: shiftId,
      userId,
      status: "CONFIRMED",
    },
    update: {
      status: "CONFIRMED",
    },
  });

  // Remove availability from original shift
  try {
    await db.availability.delete({
      where: {
        shiftId_userId: {
          shiftId,
          userId,
        },
      },
    });
  } catch (e) {
    // Ignore if not found
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
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

  revalidatePath(`/schedules/${scheduleId}`, "layout");
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

    // Check existing availability
    const existing = await db.availability.findUnique({
      where: {
        shiftId_userId: {
          shiftId: targetShiftId,
          userId: userId,
        },
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

          const isAdmin = await isScheduleAdmin(scheduleId, userId);

          // If user doesn't have role and is not admin, skip this assignment instead of throwing
          if (!hasRole && !isAdmin) continue;
        }
      }

      await db.availability.create({
        data: {
          shiftId: targetShiftId,
          userId: userId,
        },
      });
    }
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function adminAddAvailabilityAction(
  shiftId: string,
  scheduleId: string,
  email: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("User not found with this email");

  try {
    await db.availability.create({
      data: {
        shiftId,
        userId: user.id,
      },
    });
  } catch (e) {
    // Ignore if already exists
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function adminRemoveAvailabilityAction(
  shiftId: string,
  userId: string,
  scheduleId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    await db.availability.delete({
      where: {
        shiftId_userId: {
          shiftId,
          userId,
        },
      },
    });
  } catch (e) {
    // Ignore if not found
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function cancelMultipleVolunteersAction(
  scheduleId: string,
  assignments: { eventId: string; shiftId?: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  for (const { eventId, shiftId } of assignments) {
    let targetShiftId = shiftId;

    // If no specific shift provided, find generic Shift
    if (!targetShiftId) {
      const shift = await db.shift.findFirst({
        where: {
          calendarEventId: eventId,
          roleId: null,
        },
      });
      if (shift) {
        targetShiftId = shift.id;
      }
    }

    if (targetShiftId) {
      // Remove availability
      try {
        await db.availability.delete({
          where: {
            shiftId_userId: {
              shiftId: targetShiftId,
              userId: userId,
            },
          },
        });
      } catch (e) {
        // Ignore if not found
      }
    }
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

export async function adminAddEventAvailabilityAction(
  eventId: string,
  scheduleId: string,
  email: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("User not found with this email");

  // Find or create generic Shift for this event
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

  try {
    await db.availability.create({
      data: {
        shiftId: shift.id,
        userId: user.id,
      },
    });
  } catch (e) {
    // Ignore if already exists
  }

  revalidatePath(`/schedules/${scheduleId}`, "layout");
}

async function ensureCorrectShiftForUser(
  shiftId: string,
  userId: string,
  scheduleId: string
) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { calendarEvent: true },
  });
  if (!shift) throw new Error("Shift not found");

  // If shift already has a role, we are good.
  if (shift.roleId) return shiftId;

  // Shift is "Any Role". Check user's roles.
  const userRoles = await db.userRole.findMany({
    where: {
      userId,
      role: { scheduleId },
    },
    include: { role: true },
  });

  if (userRoles.length === 0) return shiftId; // User has no specific roles, keep in Any Role.

  // User has roles. Try to find a shift for the first role.
  const targetRoleId = userRoles[0].roleId;

  // Check if shift exists for this role in this event
  const existingShift = await db.shift.findFirst({
    where: {
      calendarEventId: shift.calendarEventId,
      roleId: targetRoleId,
    },
  });

  if (existingShift) {
    return existingShift.id;
  }

  // Create new shift for this role
  const newShift = await db.shift.create({
    data: {
      calendarEventId: shift.calendarEventId,
      roleId: targetRoleId,
      needed: 1,
    },
  });

  return newShift.id;
}

async function cleanupEmptyAnyRoleShift(shiftId: string) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { assignments: true, availabilities: true },
  });
  if (
    shift &&
    !shift.roleId &&
    shift.assignments.length === 0 &&
    shift.availabilities.length === 0
  ) {
    // Check if there are other shifts for this event
    const otherShifts = await db.shift.count({
      where: {
        calendarEventId: shift.calendarEventId,
        id: { not: shiftId },
      },
    });
    if (otherShifts > 0) {
      await db.shift.delete({ where: { id: shiftId } });
    }
  }
}

