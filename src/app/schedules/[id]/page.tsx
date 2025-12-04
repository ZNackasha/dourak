import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const schedule = await db.schedule.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!schedule) return notFound();

  const currentUserId = session?.user?.id;
  const isAdmin = currentUserId ? await isScheduleAdmin(id, currentUserId) : false;

  if (isAdmin) {
    redirect(`/schedules/${id}/admin`);
  } else {
    redirect(`/schedules/${id}/view`);
  }
}
