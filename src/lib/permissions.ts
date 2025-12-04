import { db } from "@/lib/prisma";

export async function isScheduleAdmin(scheduleId: string, userId: string) {
  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      admins: {
        where: { userId },
      },
    },
  });

  if (!schedule) return false;

  return schedule.userId === userId || schedule.admins.length > 0;
}
