import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ScheduleView } from "@/components/schedule-view";
import { notFound } from "next/navigation";

export default async function ScheduleViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const schedule = await db.schedule.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { start: "asc" },
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

  if (!schedule) return notFound();

  const currentUserId = session?.user?.id || "";
  
  // Fetch user's roles if logged in
  let userRoleIds: string[] = [];
  if (currentUserId) {
    const userRoles = await db.userRole.findMany({
      where: { userId: currentUserId },
      select: { roleId: true },
    });
    userRoleIds = userRoles.map((ur) => ur.roleId);
  }

  // For view mode, we don't need all roles as they can't assign
  const allRoles: any[] = [];

  return (
    <ScheduleView
      schedule={schedule}
      events={schedule.events}
      isOwner={false} // Force view mode
      userRoleIds={userRoleIds}
      allRoles={allRoles}
      currentUserId={currentUserId}
    />
  );
}
