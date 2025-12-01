import { db } from "@/lib/prisma";
import { RoleManager } from "@/components/role-manager";
import { auth } from "@/auth";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user) return <div>Please login</div>;

  const roles = await db.role.findMany({
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
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Manage Roles & Volunteers</h1>
        <p className="mt-2 text-zinc-500 max-w-2xl">
          Define roles (positions) and assign volunteers to them. Only volunteers with the assigned role can sign up for that position in a schedule.
        </p>
      </div>

      <RoleManager roles={roles} />
    </div>
  );
}
