import { auth } from "@/auth";
import { getScheduleUsers } from "@/app/actions/users";
import { UserManager } from "@/components/user-manager";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function ScheduleUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/api/auth/signin");

  const { id } = await params;
  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) return redirect(`/schedules/${id}`);

  const { users, roles } = await getScheduleUsers(id);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Manage Users
          </h1>
          <p className="mt-1 text-zinc-500">
            View and assign roles to users in this schedule.
          </p>
        </div>
        <a
          href={`/schedules/${id}`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
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
