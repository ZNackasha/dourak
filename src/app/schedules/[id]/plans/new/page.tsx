import { auth } from "@/auth";
import { createPlanAction } from "@/app/actions/schedule";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function NewPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/api/auth/signin");

  const { id } = await params;
  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) return redirect(`/schedules/${id}`);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Create New Plan</h1>
        <p className="mt-1 text-zinc-500">Set up a new rotation period. Events will be imported from the linked Google Calendar.</p>
      </div>

      <form action={createPlanAction} className="space-y-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <input type="hidden" name="scheduleId" value={id} />
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Plan Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            placeholder="e.g. December 2025"
            className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              required
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              required
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <a
            href={`/schedules/${id}`}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            Create Plan
          </button>
        </div>
      </form>
    </div>
  );
}
