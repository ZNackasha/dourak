"use client";

import { useEffect, useState } from "react";
import { Calendar, Hand, CheckCircle2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// v2: bumped so users who saw the old multi-step tour see the new one once.
const STORAGE_KEY = "dourak-onboarding-v2";

const POINTS = [
	{
		icon: Calendar,
		title: "Browse events",
		body: "Open a schedule to see upcoming events and the roles that need people.",
	},
	{
		icon: Hand,
		title: "Volunteer with one tap",
		body: "Tap a role to mark yourself available. Tap again to withdraw.",
	},
	{
		icon: CheckCircle2,
		title: "Get confirmed",
		body: "When the organizer confirms you, your spot turns green — that's it.",
	},
];

export function WelcomeTour({ autoShow = true }: { autoShow?: boolean }) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handler = () => setOpen(true);
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

	return (
		<Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Welcome to Dourak</DialogTitle>
					<DialogDescription>
						Sign up for the events that work for you — in three quick steps.
					</DialogDescription>
				</DialogHeader>

				<ul className="space-y-4 py-2">
					{POINTS.map(({ icon: Icon, title, body }) => (
						<li key={title} className="flex gap-3">
							<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Icon className="h-4 w-4" />
							</div>
							<div>
								<p className="text-sm font-medium leading-tight">{title}</p>
								<p className="text-sm text-muted-foreground">{body}</p>
							</div>
						</li>
					))}
				</ul>

				<Button onClick={finish} className="w-full">
					Got it
				</Button>
			</DialogContent>
		</Dialog>
	);
}
