import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { joinRoleViaInviteAction } from "@/app/actions/role";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const role = await db.role.findUnique({
    where: { inviteToken: token },
    include: { schedule: true },
  });

  if (!role) return notFound();

  // If not logged in, redirect to signin with callbackUrl
  if (!session?.user?.id) {
    return redirect(`/api/auth/signin?callbackUrl=/invites/${token}`);
  }

  // Check if already a member
  const existingMembership = await db.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: session.user.id,
        roleId: role.id,
      },
    },
  });

  if (existingMembership) {
    // Already a member, redirect to schedule
    if (role.scheduleId) {
      return redirect(`/schedules/${role.scheduleId}`);
    } else {
      return redirect("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-zinc-100">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">You're Invited!</h1>
        <p className="text-zinc-600 mb-8">
          You've been invited to join the <strong>{role.name}</strong> role 
          {role.schedule && <span> for <strong>{role.schedule.name}</strong></span>}.
        </p>

        <form action={joinRoleViaInviteAction.bind(null, token)}>
          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02]">
            Accept Invitation
          </button>
        </form>
        
        <p className="mt-6 text-xs text-zinc-400">
          Signed in as {session.user.email}
        </p>
      </div>
    </div>
  );
}
