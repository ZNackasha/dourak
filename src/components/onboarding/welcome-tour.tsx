"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, ShieldCheck, Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "dourak-onboarding-v1";

type Role = "admin" | "volunteer";

type Step = {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	body: React.ReactNode;
	accent: string;
};

const STEPS_ADMIN: Step[] = [
	{
		icon: Sparkles,
		title: "Welcome to Dourak",
		accent: "from-indigo-500 to-violet-600",
		body: (
			<>
				Dourak helps you coordinate volunteers for recurring events using your
				Google Calendar. Here&apos;s a quick tour of how it works.
			</>
		),
	},
	{
		icon: Calendar,
		title: "1. Create a schedule",
		accent: "from-sky-500 to-blue-600",
		body: (
			<>
				A <strong>schedule</strong> connects to a Google Calendar. Use{" "}
				<em>Create New</em> on the schedules page, pick the calendar, and Dourak
				will sync your events automatically.
			</>
		),
	},
	{
		icon: Users,
		title: "2. Add roles & users",
		accent: "from-emerald-500 to-teal-600",
		body: (
			<>
				Define the <strong>roles</strong> you need filled (Greeter, Usher,
				Tech…) and invite users. Each user can have multiple roles, and you can
				share an invite link.
			</>
		),
	},
	{
		icon: ShieldCheck,
		title: "3. Open a plan for recruitment",
		accent: "from-amber-500 to-orange-600",
		body: (
			<>
				Create a <strong>plan</strong> covering a date range. Switch it to{" "}
				<em>Recruitment</em> so volunteers can sign up for the roles they want.
				Then move it to <em>Scheduled</em> when you&apos;re ready to confirm.
			</>
		),
	},
];

const STEPS_VOLUNTEER: Step[] = [
	{
		icon: Sparkles,
		title: "Welcome to Dourak",
		accent: "from-indigo-500 to-violet-600",
		body: (
			<>
				You&apos;ve been invited to help out! Here&apos;s how to use Dourak to
				sign up for the events that work for you.
			</>
		),
	},
	{
		icon: Calendar,
		title: "1. Browse the plan",
		accent: "from-sky-500 to-blue-600",
		body: (
			<>
				Open the active plan to see every event grouped by day. Each event lists
				the <strong>roles</strong> still open for you to volunteer.
			</>
		),
	},
	{
		icon: Users,
		title: "2. Volunteer for a role",
		accent: "from-emerald-500 to-teal-600",
		body: (
			<>
				Tap a role pill to mark yourself <em>Available</em>. Tap again to
				withdraw. Use <em>I&apos;m available all day</em> to volunteer for every
				event on that day in one click.
			</>
		),
	},
	{
		icon: ShieldCheck,
		title: "3. Wait for confirmation",
		accent: "from-amber-500 to-orange-600",
		body: (
			<>
				Once the organizer confirms you, your pill turns green. You&apos;ll get
				a calendar invite and a notification. That&apos;s it!
			</>
		),
	},
];

export function WelcomeTour({
	role = "volunteer",
	autoShow = true,
}: {
	role?: Role;
	autoShow?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [stepIdx, setStepIdx] = useState(0);

	const steps = role === "admin" ? STEPS_ADMIN : STEPS_VOLUNTEER;

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handler = () => {
			setStepIdx(0);
			setOpen(true);
		};
		window.addEventListener("dourak:open-tour", handler);
		if (autoShow && !localStorage.getItem(STORAGE_KEY)) {
			setOpen(true);
		}
		return () => window.removeEventListener("dourak:open-tour", handler);
	}, [autoShow]);

	const finish = () => {
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, "1");
		}
		setOpen(false);
	};

	const step = steps[stepIdx];
	const Icon = step.icon;
	const isLast = stepIdx === steps.length - 1;

	return (
		<Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
			<DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
				<div className={`bg-gradient-to-br ${step.accent} p-6 text-white relative animate-in fade-in duration-300`}>
					<button
						onClick={finish}
						className="absolute right-3 top-3 text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
						aria-label="Close tour"
					>
						<X className="w-4 h-4" />
					</button>
					<div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-3 animate-in zoom-in-50 duration-500">
						<Icon className="w-6 h-6" />
					</div>
					<DialogHeader className="space-y-1 text-left">
						<DialogTitle className="text-white text-xl font-bold">
							{step.title}
						</DialogTitle>
						<DialogDescription className="text-white/85 text-sm leading-relaxed">
							{step.body}
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="flex items-center justify-between gap-3 p-4 bg-card">
					<div className="flex gap-1.5">
						{steps.map((_, i) => (
							<button
								key={i}
								onClick={() => setStepIdx(i)}
								aria-label={`Go to step ${i + 1}`}
								className={`h-1.5 rounded-full transition-all ${i === stepIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
									}`}
							/>
						))}
					</div>
					<div className="flex items-center gap-2">
						{stepIdx > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
							>
								<ChevronLeft className="w-4 h-4" />
								Back
							</Button>
						)}
						{!isLast ? (
							<Button size="sm" onClick={() => setStepIdx((i) => i + 1)}>
								Next
								<ChevronRight className="w-4 h-4" />
							</Button>
						) : (
							<Button size="sm" onClick={finish}>
								Get started
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
