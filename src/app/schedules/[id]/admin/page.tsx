import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ScheduleView } from "@/components/schedule-view";
import { notFound, redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

import { AdminManager } from "@/components/admin-manager";

export default async function ScheduleAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/api/auth/signin");

  const { id } = await params;

  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) {
    return notFound();
  }

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

  const currentUserId = session.user.id;

  // Fetch user's roles
  const userRoles = await db.userRole.findMany({
    where: { userId: currentUserId },
    select: { roleId: true },
  });
  const userRoleIds = userRoles.map((ur) => ur.roleId);

  // Fetch all roles for owner to assign
  const allRoles = await db.role.findMany({
    where: { scheduleId: id },
    orderBy: { name: "asc" },
  });

  // Fetch admins
  const admins = await db.scheduleAdmin.findMany({
    where: { scheduleId: id },
    include: { user: true },
  });

  // Add owner to admins list for display if not already there (though schema separates them)
  const owner = await db.user.findUnique({ where: { id: schedule.userId } });
  const allAdmins = [
    ...(owner ? [{ userId: owner.id, user: owner }] : []),
    ...admins
  ];

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <AdminManager scheduleId={schedule.id} admins={allAdmins} ownerId={schedule.userId} />
      </div>
      <div className="-mt-10">
        <ScheduleView
          schedule={schedule}
          events={schedule.events}
          isOwner={true} // Force admin mode
          userRoleIds={userRoleIds}
          allRoles={allRoles}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
