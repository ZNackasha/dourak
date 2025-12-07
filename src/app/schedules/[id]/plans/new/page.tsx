import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import { CreatePlanForm } from "@/components/create-plan-form";

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

      <CreatePlanForm scheduleId={id} />
    </div>
  );
}
