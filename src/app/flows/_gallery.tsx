"use client";

import { useState } from "react";
import {
	LayoutDashboard,
	CalendarPlus,
	Users,
	ShieldCheck,
	UserCog,
	ListChecks,
	CheckCircle2,
	Table2,
	Sparkles,
	Mail,
	CalendarCheck,
	PlayCircle,
} from "lucide-react";

import { CreateScheduleForm } from "@/components/create-schedule-form";
import { RoleManager } from "@/components/role-manager";
import { AdminManager } from "@/components/admin-manager";
import { UserManager } from "@/components/user-manager";
import { CreatePlanForm } from "@/components/create-plan-form";
import { ScheduleView } from "@/components/schedule-view";
import { ScheduleMatrix } from "@/components/schedule-matrix";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
	schedule,
	owner,
	volunteer,
	admins,
	allRoles,
	rolesForManager,
	usersForManager,
	availableRolesForManager,
	scheduleUsers,
	calendars,
	volunteerRoleIds,
	makePlan,
	makeEvents,
} from "./_data/mock";

type Step = {
	id: string;
	title: string;
	caption: string;
	node: React.ReactNode;
	/** Render the stage without the centered max-width (for wide, full-app views). */
	wide?: boolean;
};

type Story = {
	id: string;
	title: string;
	subtitle: string;
	icon: React.ComponentType<{ className?: string }>;
	steps: Step[];
};

type Persona = {
	id: "admin" | "volunteer";
	label: string;
	blurb: string;
	stories: Story[];
};

function playTour() {
	window.dispatchEvent(new Event("dourak:open-tour"));
}

/** Small representative screen for the invite-acceptance page (a server page in prod). */
function InviteAcceptCard() {
	return (
		<Card className="max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Mail className="h-6 w-6" />
				</div>
				<CardTitle className="text-xl">You&apos;ve been invited</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-center">
				<p className="text-sm text-muted-foreground">
					<strong>{owner.name}</strong> invited you to serve as{" "}
					<Badge variant="secondary">Usher</Badge> in the{" "}
					<strong>{schedule.name}</strong> schedule.
				</p>
				<div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/40 p-3">
					<Avatar className="h-8 w-8">
						<AvatarFallback>{volunteer.name?.[0]}</AvatarFallback>
					</Avatar>
					<div className="text-left">
						<p className="text-sm font-medium">{volunteer.name}</p>
						<p className="text-xs text-muted-foreground">{volunteer.email}</p>
					</div>
				</div>
				<Button className="w-full">Join role</Button>
				<p className="text-[0.7rem] text-muted-foreground">
					Volunteers only sign in with their identity — no calendar permissions
					are ever requested.
				</p>
			</CardContent>
		</Card>
	);
}

const PERSONAS: Persona[] = [
	{
		id: "admin",
		label: "Schedule Admin",
		blurb: "Owner or co-admin who builds schedules and confirms volunteers.",
		stories: [
			{
				id: "admin-onboarding",
				title: "First-run onboarding",
				subtitle: "The welcome tour an admin sees on their first visit.",
				icon: Sparkles,
				steps: [
					{
						id: "tour",
						title: "Admin welcome tour",
						caption:
							"Role-aware 4-step walkthrough (Create → Roles → Recruit → Confirm), persisted in localStorage. Click to replay it.",
						node: (
							<div className="flex flex-col items-center gap-4">
								<Button size="lg" onClick={playTour}>
									<PlayCircle className="mr-2 h-5 w-5" /> Play admin tour
								</Button>
								<p className="text-sm text-muted-foreground">
									The real <code>WelcomeTour</code> dialog opens over the page.
								</p>
							</div>
						),
					},
				],
			},
			{
				id: "admin-create-schedule",
				title: "Create a schedule",
				subtitle: "Bind a Google Calendar to a new schedule.",
				icon: CalendarPlus,
				steps: [
					{
						id: "form",
						title: "Create Schedule form",
						caption:
							"First point a calendar permission may be requested — listing calendars needs Google access. The creating user becomes the owner.",
						node: (
							<Card className="max-w-lg mx-auto">
								<CardHeader>
									<CardTitle>New schedule</CardTitle>
								</CardHeader>
								<CardContent>
									<CreateScheduleForm calendars={calendars} />
								</CardContent>
							</Card>
						),
					},
				],
			},
			{
				id: "admin-roles",
				title: "Define roles & invites",
				subtitle: "Create roles and share self-serve invite links.",
				icon: Users,
				steps: [
					{
						id: "manager",
						title: "Role Manager",
						caption:
							"Create roles (name, type, color), manage members, and generate a shareable /invites/{token} link with QR code. Select a role to see its details.",
						node: <RoleManager roles={rolesForManager} scheduleId={schedule.id} />,
						wide: true,
					},
				],
			},
			{
				id: "admin-coadmins",
				title: "Manage co-admins",
				subtitle: "Add or remove people who can edit the schedule.",
				icon: ShieldCheck,
				steps: [
					{
						id: "admins",
						title: "Admin Manager",
						caption:
							"The owner is immutable; co-admins can be added by email. Admin authority is resolved by isScheduleAdmin().",
						node: (
							<div className="max-w-xl mx-auto">
								<AdminManager
									scheduleId={schedule.id}
									admins={admins}
									ownerId={owner.id}
								/>
							</div>
						),
					},
				],
			},
			{
				id: "admin-users",
				title: "Manage volunteers & roles",
				subtitle: "Bulk-edit which roles each person holds.",
				icon: UserCog,
				steps: [
					{
						id: "users",
						title: "User Manager",
						caption:
							"See every person in the schedule (owner, admins, role members) and toggle their role membership.",
						node: (
							<UserManager
								scheduleId={schedule.id}
								initialUsers={usersForManager}
								availableRoles={availableRolesForManager}
							/>
						),
						wide: true,
					},
				],
			},
			{
				id: "admin-create-plan",
				title: "Create a plan",
				subtitle: "Import calendar events for a date range.",
				icon: ListChecks,
				steps: [
					{
						id: "plan-form",
						title: "Create Plan form",
						caption:
							"Imports Google events in the chosen range and auto-applies recurring-shift templates. Scope errors trigger a reconnect flow.",
						node: (
							<Card className="max-w-lg mx-auto">
								<CardHeader>
									<CardTitle>New plan</CardTitle>
								</CardHeader>
								<CardContent>
									<CreatePlanForm scheduleId={schedule.id} />
								</CardContent>
							</Card>
						),
					},
				],
			},
			{
				id: "admin-recruit",
				title: "Build shifts & recruit",
				subtitle: "Add role slots and open the plan for sign-ups.",
				icon: LayoutDashboard,
				steps: [
					{
						id: "recruit",
						title: "Schedule View — admin, RECRUITMENT",
						caption:
							"Admin card view: add shifts per event, see who's available, add volunteers, and change plan status. This is the recruitment workspace.",
						node: (
							<ScheduleView
								schedule={schedule}
								plan={makePlan("RECRUITMENT")}
								events={makeEvents()}
								isOwner={true}
								userRoleIds={[]}
								allRoles={allRoles}
								currentUserId={owner.id}
								scheduleUsers={scheduleUsers}
							/>
						),
						wide: true,
					},
				],
			},
			{
				id: "admin-confirm",
				title: "Confirm & publish",
				subtitle: "Lock the plan and review the finalized matrix.",
				icon: CheckCircle2,
				steps: [
					{
						id: "scheduled",
						title: "Schedule View — admin, SCHEDULED",
						caption:
							"Once a plan is SCHEDULED it switches to the read-only matrix. Confirmed assignments here are what sync to Google Calendar.",
						node: (
							<ScheduleView
								schedule={schedule}
								plan={makePlan("SCHEDULED")}
								events={makeEvents()}
								isOwner={true}
								userRoleIds={[]}
								allRoles={allRoles}
								currentUserId={owner.id}
								scheduleUsers={scheduleUsers}
							/>
						),
						wide: true,
					},
				],
			},
			{
				id: "admin-matrix",
				title: "Overview matrix",
				subtitle: "The at-a-glance grid of every event and its volunteers.",
				icon: Table2,
				steps: [
					{
						id: "matrix",
						title: "Schedule Matrix",
						caption:
							"Standalone matrix component: every event row with its shifts and scheduled volunteers, color-coded by recurring series.",
						node: <ScheduleMatrix events={makeEvents()} allRoles={allRoles} />,
						wide: true,
					},
				],
			},
		],
	},
	{
		id: "volunteer",
		label: "Volunteer",
		blurb: "Someone who serves in one or more roles — no calendar access needed.",
		stories: [
			{
				id: "vol-onboarding",
				title: "First-run onboarding",
				subtitle: "The welcome tour a volunteer sees first.",
				icon: Sparkles,
				steps: [
					{
						id: "tour",
						title: "Volunteer welcome tour",
						caption:
							"Simpler 3-step tour: find your schedule, volunteer for a role, wait for confirmation. Click to replay it.",
						node: (
							<div className="flex flex-col items-center gap-4">
								<Button size="lg" onClick={playTour}>
									<PlayCircle className="mr-2 h-5 w-5" /> Play volunteer tour
								</Button>
								<p className="text-sm text-muted-foreground">
									The real <code>WelcomeTour</code> dialog opens over the page.
								</p>
							</div>
						),
					},
				],
			},
			{
				id: "vol-invite",
				title: "Accept a role invite",
				subtitle: "Join a role from a shared invite link.",
				icon: Mail,
				steps: [
					{
						id: "invite",
						title: "Invite acceptance",
						caption:
							"Opening /invites/{token} signs the volunteer in (identity only) and creates a UserRole. No Google Calendar prompt.",
						node: <InviteAcceptCard />,
					},
				],
			},
			{
				id: "vol-volunteer",
				title: "See plan & mark availability",
				subtitle: "Sign up for the shifts you can serve.",
				icon: LayoutDashboard,
				steps: [
					{
						id: "recruit",
						title: "Schedule View — volunteer, RECRUITMENT",
						caption:
							"Volunteers only see events matching their roles (Guitarist + Usher here). Tap a role pill to mark availability, or 'I'm available all day'.",
						node: (
							<ScheduleView
								schedule={schedule}
								plan={makePlan("RECRUITMENT")}
								events={makeEvents()}
								isOwner={false}
								userRoleIds={volunteerRoleIds}
								allRoles={allRoles}
								currentUserId={volunteer.id}
								scheduleUsers={[]}
							/>
						),
						wide: true,
					},
				],
			},
			{
				id: "vol-confirmed",
				title: "View my confirmed schedule",
				subtitle: "See only the shifts you were confirmed for.",
				icon: CalendarCheck,
				steps: [
					{
						id: "confirmed",
						title: "Schedule View — volunteer, SCHEDULED",
						caption:
							"In a SCHEDULED plan the volunteer sees a matrix of only their own confirmed assignments — mirrored on their Google Calendar.",
						node: (
							<ScheduleView
								schedule={schedule}
								plan={makePlan("SCHEDULED")}
								events={makeEvents()}
								isOwner={false}
								userRoleIds={volunteerRoleIds}
								allRoles={allRoles}
								currentUserId={volunteer.id}
								scheduleUsers={[]}
							/>
						),
						wide: true,
					},
				],
			},
		],
	},
];

export function FlowsGallery() {
	const [activeStoryId, setActiveStoryId] = useState(
		PERSONAS[0].stories[0].id,
	);
	const [activeStepIdx, setActiveStepIdx] = useState(0);

	const allStories = PERSONAS.flatMap((p) =>
		p.stories.map((s) => ({ persona: p, story: s })),
	);
	const active = allStories.find((s) => s.story.id === activeStoryId)!;
	const step = active.story.steps[activeStepIdx];

	const selectStory = (id: string) => {
		setActiveStoryId(id);
		setActiveStepIdx(0);
	};

	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full">
			{/* Hidden tour instances, triggered via the dourak:open-tour event */}
			<WelcomeTour role="admin" autoShow={false} />
			<WelcomeTour role="volunteer" autoShow={false} />

			{/* Left rail */}
			<aside className="w-72 shrink-0 border-r bg-muted/20 overflow-y-auto">
				<div className="p-4 border-b">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Internal · Product
					</p>
					<h1 className="text-lg font-bold">User story gallery</h1>
					<p className="mt-1 text-xs text-muted-foreground">
						Real components, mock data. Nothing here writes to a database.
					</p>
				</div>
				{PERSONAS.map((persona) => (
					<div key={persona.id} className="p-3">
						<div className="px-2 py-1">
							<p className="text-sm font-semibold">{persona.label}</p>
							<p className="text-xs text-muted-foreground">{persona.blurb}</p>
						</div>
						<nav className="mt-1 space-y-1">
							{persona.stories.map((s) => {
								const Icon = s.icon;
								const isActive = s.id === activeStoryId;
								return (
									<button
										key={s.id}
										onClick={() => selectStory(s.id)}
										className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${isActive
												? "bg-primary text-primary-foreground"
												: "hover:bg-muted text-foreground"
											}`}
									>
										<Icon className="h-4 w-4 shrink-0" />
										<span className="truncate">{s.title}</span>
									</button>
								);
							})}
						</nav>
					</div>
				))}
			</aside>

			{/* Stage */}
			<main className="flex-1 min-w-0 flex flex-col">
				<div className="border-b bg-background/80 backdrop-blur px-6 py-4">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Badge variant="outline">{active.persona.label}</Badge>
						<span>/</span>
						<span>{active.story.title}</span>
					</div>
					<h2 className="mt-1 text-xl font-bold">{step.title}</h2>
					<p className="mt-1 max-w-3xl text-sm text-muted-foreground">
						{step.caption}
					</p>

					{active.story.steps.length > 1 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{active.story.steps.map((s, i) => (
								<button
									key={s.id}
									onClick={() => setActiveStepIdx(i)}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${i === activeStepIdx
											? "bg-foreground text-background"
											: "bg-muted text-muted-foreground hover:bg-muted/70"
										}`}
								>
									{i + 1}. {s.title}
								</button>
							))}
						</div>
					)}
				</div>

				<div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [background-size:20px_20px]">
					<div className="p-6">
						<div className="rounded-xl border bg-background shadow-sm">
							<div className="flex items-center gap-1.5 border-b px-4 py-2">
								<span className="h-3 w-3 rounded-full bg-red-400/70" />
								<span className="h-3 w-3 rounded-full bg-amber-400/70" />
								<span className="h-3 w-3 rounded-full bg-emerald-400/70" />
								<span className="ml-3 text-xs text-muted-foreground">
									{active.persona.label} · {active.story.title}
								</span>
							</div>
							<div className="p-4 sm:p-6">
								{step.wide ? (
									step.node
								) : (
									<div className="mx-auto w-full max-w-3xl">{step.node}</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
