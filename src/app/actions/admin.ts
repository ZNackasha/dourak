"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { isScheduleAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function addAdminAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const scheduleId = formData.get("scheduleId") as string;
  const email = formData.get("email") as string;

  if (!scheduleId || !email) throw new Error("Missing fields");

  // Only existing admins (or owner) can add new admins
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  // Check if already admin
  const existing = await db.scheduleAdmin.findUnique({
    where: {
      scheduleId_userId: {
        scheduleId,
        userId: user.id,
      },
    },
  });

  if (existing) return; // Already admin

  // Check if owner (cannot be added as admin, they are already super-admin)
  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (schedule?.userId === user.id) return;

  await db.scheduleAdmin.create({
    data: {
      scheduleId,
      userId: user.id,
    },
  });

  revalidatePath(`/schedules/${scheduleId}/admin`);
}

export async function removeAdminAction(scheduleId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Only existing admins can remove admins
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  await db.scheduleAdmin.delete({
    where: {
      scheduleId_userId: {
        scheduleId,
        userId,
      },
    },
  });

  revalidatePath(`/schedules/${scheduleId}/admin`);
}
