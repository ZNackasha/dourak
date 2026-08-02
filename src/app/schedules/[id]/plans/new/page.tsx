import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";
import { CreatePlanForm } from "@/components/create-plan-form";

export const maxDuration = 60;

export default async function NewPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return redirect(
      `/login?callbackUrl=/schedules/${(await params).id}/plans/new`,
    );

  const { id } = await params;
  const isAdmin = await isScheduleAdmin(id, session.user.id);
  if (!isAdmin) return redirect(`/schedules/${id}`);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Create New Plan
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set up a new rotation period. Add events yourself afterwards, or
          import them from a linked Google Calendar.
        </p>
      </div>

      <CreatePlanForm scheduleId={id} />
    </div>
  );
}
