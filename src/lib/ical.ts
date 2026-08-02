import ICAL from "ical.js";

// ---------------------------------------------------------------------------
// iCalendar (.ics) export/import for the schedule-level calendar.
// Times are emitted as "floating" local times (no timezone) to match how the
// app materializes occurrences.
// ---------------------------------------------------------------------------

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export type IcsEventInput = {
  id: string;
  title: string;
  type: string;
  start: Date | null;
  end: Date | null;
  rrule: string | null;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  shifts: { needed: number }[];
};

export type ParsedIcsEvent = {
  title: string;
  type: "ONE_OFF" | "RECURRING";
  start: Date;
  end: Date;
  rrule: string | null;
  needed: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtFloating(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function fmtUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold long content lines per RFC 5545 (max 75 octets, continuation with a
// leading space).
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let idx = 0;
  parts.push(line.slice(0, 75));
  idx = 75;
  while (idx < line.length) {
    parts.push(" " + line.slice(idx, idx + 74));
    idx += 74;
  }
  return parts.join("\r\n");
}

// Normalize a stored event into concrete start/end/rrule, synthesizing values
// for legacy simple-weekly events that predate RRULE support.
function normalize(ev: IcsEventInput): {
  start: Date;
  end: Date;
  rrule: string | null;
} | null {
  if (ev.start && ev.end) {
    return { start: ev.start, end: ev.end, rrule: ev.rrule };
  }
  if (
    ev.weekday != null &&
    ev.startTime &&
    ev.endTime &&
    /^\d{2}:\d{2}$/.test(ev.startTime) &&
    /^\d{2}:\d{2}$/.test(ev.endTime)
  ) {
    const [sh, sm] = ev.startTime.split(":").map(Number);
    const [eh, em] = ev.endTime.split(":").map(Number);
    const ref = new Date();
    ref.setHours(0, 0, 0, 0);
    while (ref.getDay() !== ev.weekday) ref.setDate(ref.getDate() + 1);
    const start = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      ref.getDate(),
      sh,
      sm,
    );
    const end = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      ref.getDate(),
      eh,
      em,
    );
    return {
      start,
      end,
      rrule: `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[ev.weekday]}`,
    };
  }
  return null;
}

export function buildScheduleIcs(
  calendarName: string,
  events: IcsEventInput[],
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dourak//Schedule Calendar//EN",
    "CALSCALE:GREGORIAN",
    fold(`X-WR-CALNAME:${escapeText(calendarName)}`),
  ];
  const stamp = fmtUtcStamp(new Date());

  for (const ev of events) {
    const norm = normalize(ev);
    if (!norm) continue;
    const needed = ev.shifts.reduce((n, s) => n + s.needed, 0) || 1;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@dourak`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(fold(`SUMMARY:${escapeText(ev.title)}`));
    lines.push(`DTSTART:${fmtFloating(norm.start)}`);
    lines.push(`DTEND:${fmtFloating(norm.end)}`);
    if (ev.type === "RECURRING" && norm.rrule) {
      const rule = norm.rrule.startsWith("RRULE:")
        ? norm.rrule
        : `RRULE:${norm.rrule}`;
      lines.push(fold(rule));
    }
    lines.push(`X-DOURAK-NEEDED:${needed}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function parseScheduleIcs(text: string): ParsedIcsEvent[] {
  const jcal = ICAL.parse(text);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");
  const out: ParsedIcsEvent[] = [];

  for (const ve of vevents) {
    const event = new ICAL.Event(ve);
    const start = event.startDate ? event.startDate.toJSDate() : null;
    if (!start) continue;
    const end = event.endDate ? event.endDate.toJSDate() : start;
    const title = (event.summary || "Untitled event").trim();

    let rrule: string | null = null;
    const recur = ve.getFirstPropertyValue("rrule");
    if (recur) {
      const s =
        typeof recur === "string" ? recur : (recur as { toString(): string }).toString();
      if (s) rrule = s.startsWith("RRULE:") ? s : `RRULE:${s}`;
    }

    const neededRaw = ve.getFirstPropertyValue("x-dourak-needed");
    const needed =
      (typeof neededRaw === "string" ? parseInt(neededRaw, 10) : NaN) || 1;

    out.push({
      title,
      type: rrule ? "RECURRING" : "ONE_OFF",
      start,
      end,
      rrule,
      needed,
    });
  }

  return out;
}
