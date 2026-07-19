import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ScheduleView } from "@/components/schedule-view";
import { notFound } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PlanPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const session = await auth();
  const { id, planId } = await params;

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      schedule: true,
      events: {
        orderBy: { start: "asc" },
        include: {
          shifts: {
            include: {
              assignments: {
                include: { user: true },
              },
              availabilities: {
                include: { user: true },
              },
              role: true,
            },
          },
        },
      },
    },
  });

  if (!plan || plan.scheduleId !== id) return notFound();

  const currentUserId = session?.user?.id;
  const isAdmin = currentUserId ? await isScheduleAdmin(id, currentUserId) : false;

  if (plan.status === "DRAFT" && !isAdmin) {
    return notFound();
  }

  // Fetch user's roles
  let userRoleIds: string[] = [];
  if (currentUserId) {
    const userRoles = await db.userRole.findMany({
      where: { userId: currentUserId },
      select: { roleId: true },
    });
    userRoleIds = userRoles.map((ur) => ur.roleId);
  }

  // Fetch all roles (needed for filtering even in view mode)
  const allRoles = await db.role.findMany({
    where: { scheduleId: id },
    orderBy: { name: "asc" },
  });

  return (
    <>
      {isAdmin && (
        <div className="max-w-5xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
          <div className={`border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${plan.status === 'DRAFT' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'
            }`}>
            <div className="flex items-start sm:items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide shrink-0 ${plan.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                }`}>
                {plan.status === 'DRAFT' ? 'Draft Mode' : 'Admin Mode'}
              </span>
              <p className={`text-sm ${plan.status === 'DRAFT' ? 'text-amber-900' : 'text-indigo-900'}`}>
                {plan.status === 'DRAFT'
                  ? "This plan is hidden from volunteers. Publish it to make it visible."
                  : "You are viewing this plan as a volunteer."}
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              render={<Link href={`/schedules/${id}/plans/${planId}/admin`} />}
            >
              Manage Plan
            </Button>
          </div>
        </div>
      )}
      <ScheduleView
        schedule={plan.schedule}
        plan={plan}
        events={plan.events}
        isOwner={false} // Always false in this view
        isAdmin={isAdmin}
        userRoleIds={userRoleIds}
        allRoles={allRoles}
        currentUserId={currentUserId || ""}
      />
    </>
  );
}
