"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createScheduleEventAction,
  deleteScheduleEventAction,
  importCalendarAction,
} from "@/app/actions/schedule-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RRule } from "rrule";
import { RecurrenceEditor } from "@/components/recurrence-editor";
import {
  CalendarPlus,
  Repeat,
  CalendarClock,
  Loader2,
  Trash2,
  X,
  Download,
  Upload,
} from "lucide-react";

type ScheduleEventShift = {
  id: string;
  roleId: string | null;
  needed: number;
  name: string | null;
};

type ScheduleEvent = {
  id: string;
  title: string;
  type: string;
  start: Date | null;
  end: Date | null;
  rrule: string | null;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  shifts: ScheduleEventShift[];
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function neededOf(event: ScheduleEvent) {
  return event.shifts.reduce((sum, s) => sum + s.needed, 0) || 1;
}

function recurrenceText(e: ScheduleEvent): string {
  if (e.rrule) {
    let base = "on a schedule";
    try {
      base = RRule.fromString(e.rrule).toText();
    } catch {
      /* keep fallback */
    }
    const time = e.start
      ? new Date(e.start).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
    return `Repeats ${base}${time ? ` at ${time}` : ""}`;
  }
  // Legacy simple-weekly events.
  if (e.weekday != null && e.startTime) {
    return `Every ${WEEKDAYS[e.weekday]}, ${e.startTime}–${e.endTime ?? ""}`;
  }
  return "Recurring";
}

export function ScheduleCalendarManager({
  scheduleId,
  events,
}: {
  scheduleId: string;
  events: ScheduleEvent[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"ONE_OFF" | "RECURRING">("ONE_OFF");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rrule, setRrule] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setType("ONE_OFF");
    setStart("");
    setEnd("");
    setRrule("");
  };

  const handleCreate = async (formData: FormData) => {
    setSaving(true);
    try {
      await createScheduleEventAction(formData);
      toast.success("Event added to calendar");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add event",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteScheduleEventAction(id, scheduleId);
      toast.success("Event removed");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove event",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("scheduleId", scheduleId);
    formData.set("file", file);
    setImporting(true);
    try {
      const res = await importCalendarAction(formData);
      toast.success(`Imported ${res.count} event${res.count === 1 ? "" : "s"}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import calendar",
      );
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const oneOff = events.filter((e) => e.type === "ONE_OFF");
  const recurring = events.filter((e) => e.type === "RECURRING");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          {open ? (
            <>
              <X className="w-4 h-4 mr-1" /> Close
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4 mr-1" /> Add Event
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          Import .ics
        </Button>

        {events.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href={`/schedules/${scheduleId}/calendar/export`}
                download
              />
            }
          >
            <Download className="w-4 h-4 mr-1" /> Export .ics
          </Button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".ics,text/calendar"
          hidden
          onChange={handleImport}
        />
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6">
            <form action={handleCreate} className="space-y-5">
              <input type="hidden" name="scheduleId" value={scheduleId} />
              <input type="hidden" name="type" value={type} />

              <div className="space-y-2">
                <Label htmlFor="cal-title">Title</Label>
                <Input
                  id="cal-title"
                  name="title"
                  required
                  placeholder="e.g. Sunday Morning Service"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setType("ONE_OFF")}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                      type === "ONE_OFF"
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        One-off
                      </span>
                      <span className="block text-[0.8rem] text-muted-foreground">
                        A single event on a specific date.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("RECURRING")}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                      type === "RECURRING"
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <Repeat className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Recurring
                      </span>
                      <span className="block text-[0.8rem] text-muted-foreground">
                        Daily, weekly, monthly, or a custom pattern.
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cal-start">
                    {type === "RECURRING" ? "First occurrence starts" : "Starts"}
                  </Label>
                  <Input
                    id="cal-start"
                    name="start"
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cal-end">
                    {type === "RECURRING" ? "First occurrence ends" : "Ends"}
                  </Label>
                  <Input
                    id="cal-end"
                    name="end"
                    type="datetime-local"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>

              {type === "RECURRING" && (
                <div className="space-y-2">
                  <Label>Repeat</Label>
                  <input type="hidden" name="rrule" value={rrule} />
                  <RecurrenceEditor
                    anchor={start ? new Date(start) : null}
                    onChange={setRrule}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cal-needed">Volunteers needed</Label>
                <Input
                  id="cal-needed"
                  name="needed"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-28"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Add Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
          <h3 className="text-foreground font-medium">No events yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Add one-off or recurring events. New plans will pull from this
            calendar automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recurring.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" /> Recurring
              </h2>
              <ul className="space-y-2">
                {recurring.map((e) => (
                  <EventRow
                    key={e.id}
                    label={e.title}
                    detail={recurrenceText(e)}
                    needed={neededOf(e)}
                    deleting={deletingId === e.id}
                    onDelete={() => handleDelete(e.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {oneOff.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> One-off
              </h2>
              <ul className="space-y-2">
                {oneOff.map((e) => (
                  <EventRow
                    key={e.id}
                    label={e.title}
                    detail={
                      e.start
                        ? new Date(e.start).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : ""
                    }
                    needed={neededOf(e)}
                    deleting={deletingId === e.id}
                    onDelete={() => handleDelete(e.id)}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({
  label,
  detail,
  needed,
  deleting,
  onDelete,
}: {
  label: string;
  detail: string;
  needed: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{label}</p>
        <p className="text-sm text-muted-foreground">
          {detail} · {needed} volunteer{needed === 1 ? "" : "s"} needed
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        className="text-destructive hover:text-destructive"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </li>
  );
}
