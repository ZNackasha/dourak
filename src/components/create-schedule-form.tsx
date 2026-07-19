"use client";

import { createScheduleAction } from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full mt-2">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Schedule
    </Button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreateScheduleForm({ calendars }: { calendars: any[] }) {
  // Base UI's <SelectValue> renders the raw value unless the root is given an
  // `items` map, so pass value -> label (calendar id -> summary) to display the
  // calendar name instead of its (random-looking) id.
  const calendarItems = calendars.map((cal) => ({
    value: cal.id,
    label: cal.summary,
  }));

  return (
    <form action={createScheduleAction} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name">Schedule Name</Label>
        <Input
          type="text"
          name="name"
          id="name"
          required
          placeholder="e.g. Sunday Service Rotation"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="calendarId">Select Calendar</Label>
        <Select
          name="calendarId"
          items={calendarItems}
          required
          defaultValue={calendars[0]?.id}
        >
          <SelectTrigger id="calendarId">
            <SelectValue placeholder="Select a calendar" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((cal) => (
              <SelectItem key={cal.id} value={cal.id}>
                {cal.summary}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">
          Events will be synced from this Google Calendar.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
