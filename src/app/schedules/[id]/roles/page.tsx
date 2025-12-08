import { db } from "@/lib/prisma";
import { RoleManager } from "@/components/role-manager";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function RolesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return <div>Please login</div>;

  const { id: scheduleId } = await params;

  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) {
    return <div>Unauthorized</div>;
  }

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) return notFound();

  const roles = await db.role.findMany({
    where: { scheduleId },
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <a href={`/schedules/${scheduleId}`} className="hover:text-zinc-900">← Back to Schedule</a>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Manage Roles & Users</h1>
        <p className="mt-2 text-zinc-500 max-w-2xl">
          Define roles (positions) for <strong>{schedule.name}</strong> and assign users to them.
        </p>
      </div>

      <RoleManager roles={roles} scheduleId={scheduleId} />
    </div>
  );
}
