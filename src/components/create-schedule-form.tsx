"use client";

import { useState } from "react";
import { createScheduleAction } from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import { CalendarPreview } from "@/components/calendar-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="w-full mt-2"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Schedule
    </Button>
  );
}

type Calendar = { id: string; summary: string };

export function CreateScheduleForm({
  calendars,
  initialName = "",
  initialMode = "build",
}: {
  calendars: Calendar[] | null;
  initialName?: string;
  initialMode?: "build" | "google";
}) {
  const [mode, setMode] = useState<"build" | "google">(initialMode);
  const [name, setName] = useState(initialName);
  const [calendarId, setCalendarId] = useState<string>("");

  const calendarItems = (calendars ?? []).map((cal) => ({
    value: cal.id,
    label: cal.summary,
  }));
  const canImport = !!calendars && calendars.length > 0;
  const needsCalendar = mode === "google" && !calendarId;

  // Preserve the typed name + google mode across the OAuth round-trip.
  const connectHref = `/api/auth/google/connect?callbackUrl=${encodeURIComponent(
    `/schedules/new?mode=google${name ? `&name=${encodeURIComponent(name)}` : ""}`,
  )}`;

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
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>How do you want to manage events?</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors",
              mode === "build"
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40",
            )}
          >
            <input
              type="radio"
              name="mode"
              value="build"
              checked={mode === "build"}
              onChange={() => setMode("build")}
              className="sr-only"
            />
            <span className="text-sm font-medium text-foreground">
              Build your own
            </span>
            <span className="text-[0.8rem] text-muted-foreground">
              Add and edit events yourself in Dourak. No Google account
              required.
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors",
              mode === "google"
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40",
            )}
          >
            <input
              type="radio"
              name="mode"
              value="google"
              checked={mode === "google"}
              onChange={() => setMode("google")}
              className="sr-only"
            />
            <span className="text-sm font-medium text-foreground">
              Use Google Calendar
            </span>
            <span className="text-[0.8rem] text-muted-foreground">
              Import and sync events from one of your Google calendars.
            </span>
          </label>
        </div>
      </div>

      {mode === "google" &&
        (canImport ? (
          <div className="space-y-2">
            <Label htmlFor="calendarId">Google Calendar</Label>
            <Select
              name="calendarId"
              items={calendarItems}
              required
              value={calendarId}
              onValueChange={(value) => setCalendarId((value as string) ?? "")}
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
            {needsCalendar && (
              <p className="text-[0.8rem] text-muted-foreground">
                Select a calendar to continue.
              </p>
            )}
            {calendarId && <CalendarPreview calendarId={calendarId} />}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-[0.8rem] text-muted-foreground">
              Connect your Google account to choose a calendar.
            </p>
            <a
              href={connectHref}
              className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              Connect Google
            </a>
          </div>
        ))}

      <SubmitButton disabled={needsCalendar} />
    </form>
  );
}
