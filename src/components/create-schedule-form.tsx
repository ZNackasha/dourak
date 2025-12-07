"use client";

import { createScheduleAction } from "@/app/actions/schedule";

export function CreateScheduleForm({ calendars }: { calendars: any[] }) {
  return (
    <form action={createScheduleAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Schedule Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          placeholder="e.g. Sunday Service Rotation"
          className="w-full rounded-lg border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="calendarId" className="block text-sm font-medium text-zinc-700">
          Select Calendar
        </label>
        <select
          name="calendarId"
          id="calendarId"
          required
          className="w-full rounded-lg border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.summary}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">Events will be synced from this Google Calendar.</p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Create Schedule
        </button>
      </div>
    </form>
  );
}
