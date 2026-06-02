import { getCalendarsAction } from "@/app/actions/schedule";
import { connectGoogleCalendarAction } from "@/app/actions/auth";
import { CreateScheduleForm } from "@/components/create-schedule-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  let calendars = [];
  try {
    calendars = await getCalendarsAction();
  } catch (e: any) {
    console.error("Failed to load calendars:", e);
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Connect Google Calendar</h1>

        <p className="mb-8 text-muted-foreground max-w-md mx-auto">
          To create a schedule, we need access to your Google Calendar to fetch events and sync shifts.
        </p>
        <form action={connectGoogleCalendarAction}>
          <Button type="submit" size="lg">
            Grant Calendar Permission
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Create New Schedule</h1>
        <p className="mt-2 text-muted-foreground">Set up a new rotation by selecting a calendar and date range.</p>
      </div>
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <CreateScheduleForm calendars={calendars} />
      </div>
    </div>
  );
}
