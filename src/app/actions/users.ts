"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { isScheduleAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getScheduleUsers(scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // Fetch all roles for this schedule to know what's available
  const roles = await db.role.findMany({
    where: { scheduleId },
    orderBy: { name: "asc" },
  });

  // Fetch users who have roles in this schedule
  // We also want to include the owner and admins even if they don't have roles
  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      user: true, // Owner
      admins: { include: { user: true } }, // Admins
    },
  });

  if (!schedule) throw new Error("Schedule not found");

  // Find users with roles in this schedule
  const usersWithRoles = await db.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            scheduleId: scheduleId,
          },
        },
      },
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
    },
  });

  // Combine all users (Owner, Admins, Role-holders)
  const allUsersMap = new Map<string, any>();

  // Add Owner
  if (schedule.user) {
    allUsersMap.set(schedule.user.id, {
      ...schedule.user,
      roles: [], // Will be populated if they are in usersWithRoles
      isOwner: true,
      isAdmin: true,
    });
  }

  // Add Admins
  schedule.admins.forEach((admin) => {
    if (allUsersMap.has(admin.userId)) {
      const u = allUsersMap.get(admin.userId);
      u.isAdmin = true;
    } else {
      allUsersMap.set(admin.userId, {
        ...admin.user,
        roles: [],
        isOwner: false,
        isAdmin: true,
      });
    }
  });

  // Add/Merge Users with Roles
  usersWithRoles.forEach((u) => {
    if (allUsersMap.has(u.id)) {
      const existing = allUsersMap.get(u.id);
      existing.roles = u.roles;
    } else {
      allUsersMap.set(u.id, {
        ...u,
        isOwner: false,
        isAdmin: false, // Unless they were added above
      });
    }
  });

  return {
    users: Array.from(allUsersMap.values()),
    roles,
  };
}

export async function updateUserRoles(
  scheduleId: string,
  targetUserId: string,
  roleIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  // Verify all roles belong to this schedule
  const validRoles = await db.role.count({
    where: {
      id: { in: roleIds },
      scheduleId,
    },
  });

  if (validRoles !== roleIds.length) {
    throw new Error("Invalid roles provided");
  }

  // Transaction to update roles
  await db.$transaction(async (tx) => {
    // 1. Remove existing roles for this user in this schedule
    // We need to find the IDs of UserRoles to delete
    const existingUserRoles = await tx.userRole.findMany({
      where: {
        userId: targetUserId,
        role: {
          scheduleId,
        },
      },
    });

    if (existingUserRoles.length > 0) {
      await tx.userRole.deleteMany({
        where: {
          userId: targetUserId,
          roleId: {
            in: existingUserRoles.map((ur) => ur.roleId),
          },
        },
      });
    }

    // 2. Add new roles
    if (roleIds.length > 0) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: targetUserId,
          roleId,
          type: "required", // Defaulting to required for now
        })),
      });
    }
  });

  revalidatePath(`/schedules/${scheduleId}/users`);
}

