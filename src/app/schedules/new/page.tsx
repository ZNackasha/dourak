import { getCalendarsAction } from "@/app/actions/schedule";
import { CreateScheduleForm } from "@/components/create-schedule-form";

export const dynamic = "force-dynamic";

type Calendar = { id: string; summary: string };

export default async function NewSchedulePage() {
  // Google Calendar is optional. If the user hasn't linked Google (or lacks the
  // calendar scope), we simply offer native creation and a "Connect" option.
  let calendars: Calendar[] | null = null;
  try {
    calendars = (await getCalendarsAction()) as Calendar[];
  } catch {
    calendars = null;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Create New Schedule
        </h1>
        <p className="mt-2 text-muted-foreground">
          Name your schedule and start adding events. You can optionally import
          from a Google Calendar.
        </p>
      </div>
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <CreateScheduleForm calendars={calendars} />
      </div>
    </div>
  );
}
