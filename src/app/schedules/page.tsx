import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import Link from "next/link";

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Please login</div>;

  const schedules = await db.schedule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Schedules</h1>
          <p className="mt-1 text-zinc-500">Manage your service rotations and events.</p>
        </div>
        <Link
          href="/schedules/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
        >
          Create New
        </Link>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Link
            key={schedule.id}
            href={`/schedules/${schedule.id}`}
            className="block p-6 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {schedule.name}
                </h2>
                <p className="text-zinc-500 mt-1 text-sm">
                  Manage plans and roles
                </p>
              </div>
              <span className="text-zinc-400 group-hover:text-indigo-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
        {schedules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-zinc-200">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-zinc-900 font-medium">No schedules found</h3>
            <p className="text-zinc-500 text-sm mt-1">Create a new schedule to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
