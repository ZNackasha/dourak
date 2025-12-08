import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isScheduleAdmin } from "@/lib/permissions";
import { AdminManager } from "@/components/admin-manager";
import { DeleteScheduleButton } from "@/components/delete-schedule-button";
import { SyncScheduleButton } from "@/components/sync-schedule-button";

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{schedule.name}</h1>
          <p className="mt-1 text-zinc-500">Manage plans and rotations.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <SyncScheduleButton scheduleId={id} />
            <Link
              href={`/schedules/${id}/users`}
              className="bg-white text-zinc-700 border border-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm transition-colors"
            >
              Manage Users
            </Link>
            <Link
              href={`/schedules/${id}/roles`}
              className="bg-white text-zinc-700 border border-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm transition-colors"
            >
              Manage Roles
            </Link>
            <Link
              href={`/schedules/${id}/plans/new`}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Create New Plan
            </Link>
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
        {schedule.plans.map((plan) => (
          <Link
            key={plan.id}
            href={isAdmin ? `/schedules/${id}/plans/${plan.id}/admin` : `/schedules/${id}/plans/${plan.id}`}
            className="block p-6 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {plan.name}
                </h2>
                <p className="text-zinc-500 mt-1 text-sm">
                  {plan.startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })} - {plan.endDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${plan.status === 'RECRUITMENT' ? 'bg-green-100 text-green-800' :
                  plan.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {plan.status}
                </span>
              </div>
              <span className="text-zinc-400 group-hover:text-indigo-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
        {schedule.plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-zinc-200">
            <h3 className="text-zinc-900 font-medium">No plans found</h3>
            <p className="text-zinc-500 text-sm mt-1">Create a new plan to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
