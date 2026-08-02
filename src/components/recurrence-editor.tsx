"use client";

import { useEffect, useMemo, useState } from "react";
import { RRule } from "rrule";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// getDay() index (0=Sun..6=Sat) → rrule Weekday
const WD_BY_JS_DAY = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];
const WD_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const WD_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const NTH_LABEL = ["first", "second", "third", "fourth", "fifth"];

type EndCfg = { type: "never" | "until" | "count"; until: string; count: number };

export function RecurrenceEditor({
  anchor,
  onChange,
}: {
  anchor: Date | null;
  onChange: (rrule: string) => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState("WEEKLY");

  const [freq, setFreq] = useState<number>(RRule.WEEKLY);
  const [interval, setIntervalValue] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"day" | "weekday">("day");
  const [end, setEnd] = useState<EndCfg>({ type: "never", until: "", count: 10 });

  const anchorDay = anchor ? anchor.getDay() : 0;
  const anchorDate = anchor ? anchor.getDate() : 1;
  const anchorNth = anchor ? Math.ceil(anchor.getDate() / 7) : 1;

  // Seed the weekly weekday selection with the anchor's weekday.
  useEffect(() => {
    if (anchor) setWeekdays((prev) => (prev.length ? prev : [anchor.getDay()]));
  }, [anchor]);

  const patternOpts = useMemo(() => {
    const opts: Record<string, unknown> = {};
    if (mode === "preset") {
      switch (preset) {
        case "DAILY":
          opts.freq = RRule.DAILY;
          break;
        case "WEEKLY":
          opts.freq = RRule.WEEKLY;
          opts.byweekday = [WD_BY_JS_DAY[anchorDay]];
          break;
        case "MONTHLY":
          opts.freq = RRule.MONTHLY;
          opts.bymonthday = [anchorDate];
          break;
        case "YEARLY":
          opts.freq = RRule.YEARLY;
          break;
        case "WEEKDAYS":
          opts.freq = RRule.WEEKLY;
          opts.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
          break;
        default:
          opts.freq = RRule.WEEKLY;
      }
    } else {
      opts.freq = freq;
      opts.interval = Math.max(1, interval);
      if (freq === RRule.WEEKLY) {
        const days = weekdays.length ? weekdays : [anchorDay];
        opts.byweekday = days.map((d) => WD_BY_JS_DAY[d]);
      }
      if (freq === RRule.MONTHLY) {
        if (monthlyMode === "day") opts.bymonthday = [anchorDate];
        else opts.byweekday = [WD_BY_JS_DAY[anchorDay].nth(anchorNth)];
      }
    }
    return opts;
  }, [
    mode,
    preset,
    freq,
    interval,
    weekdays,
    monthlyMode,
    anchorDay,
    anchorDate,
    anchorNth,
  ]);

  // The end condition applies to BOTH presets and custom patterns.
  const rrule = useMemo(() => {
    const opts: Record<string, unknown> = { ...patternOpts };
    if (end.type === "count") opts.count = Math.max(1, end.count);
    if (end.type === "until" && end.until) {
      const d = new Date(end.until + "T23:59:59");
      if (!isNaN(d.getTime())) opts.until = d;
    }
    try {
      return new RRule(opts).toString();
    } catch {
      return "";
    }
  }, [patternOpts, end]);

  const patternText = useMemo(() => {
    try {
      return new RRule(patternOpts).toText();
    } catch {
      return "";
    }
  }, [patternOpts]);

  const endText =
    end.type === "until" && end.until
      ? `until ${new Date(end.until + "T00:00").toLocaleDateString(undefined, {
          dateStyle: "medium",
        })}`
      : end.type === "count"
        ? `${Math.max(1, end.count)} time${end.count === 1 ? "" : "s"}`
        : "never — repeats forever";

  useEffect(() => {
    onChange(rrule);
  }, [rrule, onChange]);

  const toggleWeekday = (d: number) =>
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Repeats</span>
        <select
          className={selectClass}
          value={mode === "custom" ? "CUSTOM" : preset}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "CUSTOM") {
              setMode("custom");
            } else {
              setMode("preset");
              setPreset(v);
            }
          }}
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">
            Weekly{anchor ? ` on ${WD_FULL[anchorDay]}` : ""}
          </option>
          <option value="MONTHLY">
            Monthly{anchor ? ` on day ${anchorDate}` : ""}
          </option>
          <option value="YEARLY">Annually</option>
          <option value="WEEKDAYS">Every weekday (Mon–Fri)</option>
          <option value="CUSTOM">Custom…</option>
        </select>
      </div>

      {mode === "custom" && (
        <div className="space-y-3 pt-1">
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Repeat every
              </span>
              <Input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                className="w-20"
              />
            </div>
            <select
              className={cn(selectClass, "w-32")}
              value={freq}
              onChange={(e) => setFreq(parseInt(e.target.value))}
            >
              <option value={RRule.DAILY}>day(s)</option>
              <option value={RRule.WEEKLY}>week(s)</option>
              <option value={RRule.MONTHLY}>month(s)</option>
              <option value={RRule.YEARLY}>year(s)</option>
            </select>
          </div>

          {freq === RRule.WEEKLY && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Repeat on
              </span>
              <div className="flex gap-1.5">
                {WD_LABELS.map((lbl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    aria-label={WD_FULL[i]}
                    className={cn(
                      "h-8 w-8 rounded-full text-sm font-medium transition-colors",
                      (weekdays.length ? weekdays : [anchorDay]).includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {freq === RRule.MONTHLY && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Monthly on
              </span>
              <select
                className={selectClass}
                value={monthlyMode}
                onChange={(e) =>
                  setMonthlyMode(e.target.value as "day" | "weekday")
                }
              >
                <option value="day">Day {anchorDate} of the month</option>
                <option value="weekday">
                  The {NTH_LABEL[anchorNth - 1] ?? `${anchorNth}th`}{" "}
                  {WD_FULL[anchorDay]}
                </option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          Stop repeating
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="rec-end"
              checked={end.type === "never"}
              onChange={() => setEnd((e) => ({ ...e, type: "never" }))}
            />
            <span className="font-medium">Never</span>
            <span className="text-muted-foreground">(repeats forever)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="rec-end"
              checked={end.type === "until"}
              onChange={() => setEnd((e) => ({ ...e, type: "until" }))}
            />
            On
            <Input
              type="date"
              value={end.until}
              onChange={(e) =>
                setEnd((prev) => ({
                  ...prev,
                  type: "until",
                  until: e.target.value,
                }))
              }
              className="w-40"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="rec-end"
              checked={end.type === "count"}
              onChange={() => setEnd((e) => ({ ...e, type: "count" }))}
            />
            After
            <Input
              type="number"
              min={1}
              value={end.count}
              onChange={(e) =>
                setEnd((prev) => ({
                  ...prev,
                  type: "count",
                  count: parseInt(e.target.value) || 1,
                }))
              }
              className="w-20"
            />
            times
          </label>
        </div>
      </div>

      {patternText && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium text-foreground">Summary: </span>
          <span className="text-foreground">
            Repeats {patternText}
            {anchor ? "" : " — pick a start date to finalize"}.
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            Stops: {endText}.
          </span>
        </div>
      )}
    </div>
  );
}
