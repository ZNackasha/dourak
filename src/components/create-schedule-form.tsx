"use client";

import { useState } from "react";
import { createScheduleAction } from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type Calendar = { id: string; summary: string };

export function CreateScheduleForm({
  calendars,
}: {
  calendars: Calendar[] | null;
}) {
  const [linkGoogle, setLinkGoogle] = useState(false);

  const calendarItems = (calendars ?? []).map((cal) => ({
    value: cal.id,
    label: cal.summary,
  }));
  const canImport = !!calendars && calendars.length > 0;

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
        <p className="text-[0.8rem] text-muted-foreground">
          You&apos;ll add events to this schedule yourself — no calendar
          required.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        {canImport ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="linkGoogle" className="text-sm">
                  Import from Google Calendar
                </Label>
                <p className="text-[0.8rem] text-muted-foreground">
                  Optionally sync events from one of your Google calendars.
                </p>
              </div>
              <Switch
                id="linkGoogle"
                checked={linkGoogle}
                onCheckedChange={setLinkGoogle}
              />
            </div>

            {linkGoogle && (
              <div className="space-y-2 pt-1">
                <Label htmlFor="calendarId">Google Calendar</Label>
                <Select
                  name="calendarId"
                  items={calendarItems}
                  required={linkGoogle}
                  defaultValue={calendars?.[0]?.id}
                >
                  <SelectTrigger id="calendarId" className="w-full">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(calendars ?? []).map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.summary}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Import from Google Calendar
              </p>
              <p className="text-[0.8rem] text-muted-foreground">
                Connect Google to optionally import events later.
              </p>
            </div>
            <a
              href="/api/auth/google/connect?callbackUrl=/schedules/new"
              className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              Connect Google
            </a>
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
