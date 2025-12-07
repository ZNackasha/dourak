import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ScheduleView } from "@/components/schedule-view";
import { notFound, redirect } from "next/navigation";
import { isScheduleAdmin } from "@/lib/permissions";

export default async function PlanAdminPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
	const session = await auth();
	const { id, planId } = await params;

	const currentUserId = session?.user?.id;
	if (!currentUserId) return redirect("/api/auth/signin");

	const isAdmin = await isScheduleAdmin(id, currentUserId);
	if (!isAdmin) return notFound();

	const plan = await db.plan.findUnique({
		where: { id: planId },
		include: {
			schedule: true,
			events: {
				orderBy: { start: "asc" },
				include: {
					shifts: {
						include: {
							assignments: {
								include: { user: true },
							},
							availabilities: {
								include: { user: true },
							},
							role: true,
						},
					},
				},
			},
		},
	});

	if (!plan || plan.scheduleId !== id) return notFound();

	// Fetch user's roles
	const userRoles = await db.userRole.findMany({
		where: { userId: currentUserId },
		select: { roleId: true },
	});
	const userRoleIds = userRoles.map((ur) => ur.roleId);

	// Fetch all roles for owner to assign
	const allRoles = await db.role.findMany({
		where: { scheduleId: id },
		orderBy: { name: "asc" },
	});

	return (
		<div className="space-y-8">
			<div className="mt-1">
				<ScheduleView
					schedule={plan.schedule}
					plan={plan}
					events={plan.events}
					isOwner={true}
					userRoleIds={userRoleIds}
					allRoles={allRoles}
					currentUserId={currentUserId}
				/>
			</div>
		</div>
	);
}
