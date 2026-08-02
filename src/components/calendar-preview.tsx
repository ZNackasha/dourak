"use client";

import { useEffect, useState } from "react";
import { previewCalendarEventsAction } from "@/app/actions/schedule";
import { CalendarDays, ExternalLink, Loader2 } from "lucide-react";

type PreviewEvent = {
	id: string;
	title: string;
	start: string | null;
	end: string | null;
};

function eventDayKey(start: string): string {
	// Date-only strings (all-day events) must not be shifted by the timezone.
	if (!start.includes("T")) return start;
	const d = new Date(start);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string): string {
	const [y, m, d] = key.split("-").map(Number);
	const date = new Date(y, m - 1, d);
	const today = new Date();
	const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
	if (date.toDateString() === today.toDateString()) return "Today";
	if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function eventTime(e: PreviewEvent): string {
	if (!e.start || !e.start.includes("T")) return "All day";
	return new Date(e.start).toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
}

/** Agenda-style view of a Google calendar's upcoming events (next 30 days). */
export function CalendarPreview({ calendarId }: { calendarId: string }) {
	const [events, setEvents] = useState<PreviewEvent[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setEvents(null);
		setError(null);
		previewCalendarEventsAction(calendarId)
			.then((data) => {
				if (!cancelled) setEvents(data);
			})
			.catch(() => {
				if (!cancelled) setError("Couldn't load events for this calendar.");
			});
		return () => {
			cancelled = true;
		};
	}, [calendarId]);

	return (
		<div className="rounded-lg border border-border bg-card">
			<div className="flex items-center justify-between gap-2 border-b border-border p-2.5">
				<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<CalendarDays className="size-3.5" />
					Upcoming — next 30 days
					{events === null && !error && (
						<Loader2 className="size-3.5 animate-spin" />
					)}
				</p>
				<a
					href={`https://calendar.google.com/calendar/u/0/embed?src=${encodeURIComponent(calendarId)}`}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					Open in Google Calendar
					<ExternalLink className="size-3" />
				</a>
			</div>

			<div className="max-h-80 overflow-y-auto p-2.5">
				{error && <p className="text-sm text-muted-foreground">{error}</p>}
				{events && events.length === 0 && (
					<p className="text-sm text-muted-foreground">
						No upcoming events in the next 30 days.
					</p>
				)}
				<ul className="space-y-1">
					{(events ?? [])
						.filter((e) => e.start)
						.map((e) => (
							<li key={e.id} className="flex items-baseline gap-2 text-sm">
								<span className="w-24 shrink-0 text-xs font-medium text-foreground">
									{dayLabel(eventDayKey(e.start!))}
								</span>
								<span className="w-16 shrink-0 text-xs text-muted-foreground">
									{eventTime(e)}
								</span>
								<span className="min-w-0 truncate border-l-2 border-primary/60 pl-2 text-foreground">
									{e.title}
								</span>
							</li>
						))}
				</ul>
			</div>
		</div>
	);
}
