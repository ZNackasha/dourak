import { getCalendarsAction } from "@/app/actions/schedule";
import { connectGoogleCalendarAction } from "@/app/actions/auth";
import { CreateScheduleForm } from "@/components/create-schedule-form";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  let calendars = [];
  try {
    calendars = await getCalendarsAction();
  } catch (e: any) {
    console.error("Failed to load calendars:", e);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">Connect Google Calendar</h1>

        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-left overflow-auto max-h-40 text-sm">
          <p className="font-semibold mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Connection Error
          </p>
          <pre className="whitespace-pre-wrap font-mono text-xs opacity-90">{e.message}</pre>
        </div>

        <p className="mb-8 text-zinc-600 max-w-md mx-auto">
          To create a schedule, we need access to your Google Calendar to fetch events and sync shifts.
        </p>
        <form action={connectGoogleCalendarAction}>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-all hover:shadow-md"
          >
            Grant Calendar Permission
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Create New Schedule</h1>
        <p className="mt-2 text-zinc-500">Set up a new rotation by selecting a calendar and date range.</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
        <CreateScheduleForm calendars={calendars} />
      </div>
    </div>
  );
}
