"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
	updateEmailPreferenceAction,
	type EmailPreferenceKind,
} from "@/app/actions/settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Prefs = {
	emailRecruitment: boolean;
	emailSchedule: boolean;
	emailRoleAdded: boolean;
};

const OPTIONS: {
	kind: EmailPreferenceKind;
	title: string;
	description: string;
}[] = [
		{
			kind: "emailRecruitment",
			title: "Sign-up requests",
			description: "When an organizer opens a plan for volunteer sign-ups.",
		},
		{
			kind: "emailSchedule",
			title: "Schedule notifications",
			description: "When you've been scheduled for shifts and need to confirm.",
		},
		{
			kind: "emailRoleAdded",
			title: "Added to a role",
			description: "When an organizer adds you to a role in a schedule.",
		},
	];

export function EmailPreferences({ initial }: { initial: Prefs }) {
	const [prefs, setPrefs] = useState<Prefs>(initial);

	const toggle = async (kind: EmailPreferenceKind, enabled: boolean) => {
		const previous = prefs[kind];
		setPrefs((p) => ({ ...p, [kind]: enabled }));
		try {
			await updateEmailPreferenceAction(kind, enabled);
			toast.success(enabled ? "Emails enabled" : "Emails turned off");
		} catch {
			setPrefs((p) => ({ ...p, [kind]: previous }));
			toast.error("Couldn't save your preference");
		}
	};

	return (
		<div className="divide-y divide-border rounded-xl border border-border bg-card">
			{OPTIONS.map(({ kind, title, description }) => (
				<div
					key={kind}
					className="flex items-center justify-between gap-4 p-4"
				>
					<div>
						<Label htmlFor={kind} className="text-sm font-medium">
							{title}
						</Label>
						<p className="mt-0.5 text-sm text-muted-foreground">
							{description}
						</p>
					</div>
					<Switch
						id={kind}
						checked={prefs[kind]}
						onCheckedChange={(checked) => toggle(kind, checked)}
					/>
				</div>
			))}
		</div>
	);
}
