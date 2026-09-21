import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmailPreferences } from "@/components/email-preferences";
import { PhoneForm } from "@/components/phone-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login?callbackUrl=/settings");

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: {
			phone: true,
			emailRecruitment: true,
			emailSchedule: true,
			emailRoleAdded: true,
		},
	});
	if (!user) redirect("/login?callbackUrl=/settings");

	return (
		<div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground tracking-tight">
					Settings
				</h1>
				<p className="mt-2 text-muted-foreground">
					Choose which emails you want to receive.
				</p>
			</div>
			<h2 className="text-sm font-semibold text-foreground mb-3">
				Contact
			</h2>
			<div className="mb-8 rounded-xl border border-border bg-card p-4">
				<PhoneForm initial={user.phone} />
			</div>
			<h2 className="text-sm font-semibold text-foreground mb-3">
				Email notifications
			</h2>
			<EmailPreferences initial={user} />
		</div>
	);
}
