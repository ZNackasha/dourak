"use client";

import { createPlanAction } from "@/app/actions/schedule";
import { useFormStatus } from "react-dom";
import { useState, useEffect } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  const [justClicked, setJustClicked] = useState(false);

  useEffect(() => {
    if (justClicked) {
      const timer = setTimeout(() => setJustClicked(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [justClicked]);

  const isDisabled = pending || justClicked;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      onClick={() => setJustClicked(true)}
      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDisabled ? "Creating..." : "Create Plan"}
    </button>
  );
}

export function CreatePlanForm({ scheduleId }: { scheduleId: string }) {
  return (
    <form
      action={createPlanAction}
      className="space-y-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
    >
      <input type="hidden" name="scheduleId" value={scheduleId} />

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 mb-1"
        >
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
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          href={`/schedules/${scheduleId}`}
          className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
        >
          Cancel
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
