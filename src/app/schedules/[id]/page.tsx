import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isScheduleAdmin } from "@/lib/permissions";
import { AdminManager } from "@/components/admin-manager";
import { DeleteScheduleButton } from "@/components/delete-schedule-button";
import { SyncScheduleButton } from "@/components/sync-schedule-button";
import { Button } from "@/components/ui/button";

export const maxDuration = 60;

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const currentUserId = session?.user?.id;
  const isAdmin = currentUserId ? await isScheduleAdmin(id, currentUserId) : false;

  const schedule = await db.schedule.findUnique({
    where: { id },
    include: {
      plans: {
        orderBy: { startDate: "desc" },
        where: isAdmin ? undefined : { status: { not: "DRAFT" } },
      },
    },
  });

  if (!schedule) return notFound();

  // Fetch admins if user is admin
  let allAdmins: any[] = [];
  if (isAdmin) {
    const admins = await db.scheduleAdmin.findMany({
      where: { scheduleId: id },
      include: { user: true },
    });
    const owner = await db.user.findUnique({ where: { id: schedule.userId } });
    allAdmins = [
      ...(owner ? [{ userId: owner.id, user: owner }] : []),
      ...admins
    ];
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{schedule.name}</h1>
          <p className="mt-1 text-muted-foreground">Manage plans and rotations.</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <SyncScheduleButton scheduleId={id} />
            <Button variant="outline" render={<Link href={`/schedules/${id}/users`} />}>
              Manage Users
            </Button>
            <Button variant="outline" render={<Link href={`/schedules/${id}/roles`} />}>
              Manage Roles
            </Button>
            <Button render={<Link href={`/schedules/${id}/plans/new`} />}>
              Create New Plan
            </Button>
            <DeleteScheduleButton scheduleId={id} />
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-10">
          <AdminManager scheduleId={id} admins={allAdmins} ownerId={schedule.userId} />
        </div>
      )}

      <div className="grid gap-4">
        {schedule.plans.map((plan, idx) => (
          <Link
            key={plan.id}
            href={isAdmin ? `/schedules/${id}/plans/${plan.id}/admin` : `/schedules/${id}/plans/${plan.id}`}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="block p-6 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all group animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {plan.name}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {plan.startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })} - {plan.endDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${plan.status === 'RECRUITMENT' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' :
                  plan.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' :
                    'bg-muted text-muted-foreground'
                  }`}>
                  {plan.status}
                </span>
              </div>
              <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
        {schedule.plans.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
            <h3 className="text-foreground font-medium">No plans found</h3>
            <p className="text-muted-foreground text-sm mt-1">Create a new plan to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
