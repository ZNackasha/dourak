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
    <Button disabled={pending} className="w-full mt-2">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Schedule
    </Button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreateScheduleForm({ calendars }: { calendars: any[] }) {
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
        <Select name="calendarId" required defaultValue={calendars[0]?.id}>
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
