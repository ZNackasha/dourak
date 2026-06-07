import { auth } from "@/auth";
import { getScheduleUsers } from "@/app/actions/user";
import { UserManager } from "@/components/user-manager";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function ScheduleUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return redirect(`/login?callbackUrl=/schedules/${(await params).id}/users`);

  const { id } = await params;
  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) return redirect(`/schedules/${id}`);

  const { users, roles } = await getScheduleUsers(id);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Manage Users
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and assign roles to users in this schedule.
          </p>
        </div>
        <a
          href={`/schedules/${id}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Schedule
        </a>
      </div>

      <UserManager
        scheduleId={id}
        initialUsers={users}
        availableRoles={roles}
      />
    </div>
  );
}
