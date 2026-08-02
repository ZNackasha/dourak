"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isScheduleAdmin } from "@/lib/permissions";
import { createEmailTransport, emailFrom } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";

const requiredString = z.string().min(1, "This field is required");

/** Email sent when an organizer adds someone to a role. Invite-style for the
 * first role / users without a login; a short update otherwise. */
async function sendRoleAddedEmail({
  email,
  name,
  roleName,
  scheduleName,
  firstRole,
  hasLogin,
}: {
  email: string;
  name: string | null;
  roleName: string;
  scheduleName: string | null;
  firstRole: boolean;
  hasLogin: boolean;
}) {
  const site = getSiteUrl();
  const greeting = name ? `Hi ${name},` : "Hi,";
  const where = scheduleName ? ` in "${scheduleName}"` : "";

  const explainer = firstRole
    ? `

What that means:
- Dourak is where your team organizes who serves at which events.
- When sign-ups open, you'll pick the dates that work for you.
- Once the organizer confirms you, you're on the schedule — that's it.`
    : "";

  const cta = hasLogin
    ? `

See your schedules: ${site}/schedules`
    : `

Get started by signing in with this email address (${email}):
${site}/login

You can sign in with Google, or create an account with this email and a password — either works.`;

  const text = `${greeting}

You've been added as a "${roleName}" volunteer${where} on Dourak.${explainer}${cta}

Thanks,
Dourak

—
Manage which emails you receive: ${site}/settings`;

  const subject = firstRole
    ? `You've been invited as ${roleName}${scheduleName ? ` — ${scheduleName}` : ""}`
    : `Role update: ${roleName}${scheduleName ? ` — ${scheduleName}` : ""}`;

  try {
    await createEmailTransport().sendMail({
      from: emailFrom(),
      to: email,
      subject,
      text,
    });

    if (!process.env.EMAIL_SERVER) {
      console.log("----------------------------------------------");
      console.log(`Role-added email to ${email}:`);
      console.log(text);
      console.log("----------------------------------------------");
    }
  } catch (e) {
    // Email failure must not block adding the user to the role.
    console.error(`Failed to send role-added email to ${email}`, e);
  }
}

export async function createRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const scheduleId = formData.get("scheduleId") as string;
  if (!scheduleId) throw new Error("Schedule ID is required");

  // Check admin permission
  const isAdmin = await isScheduleAdmin(scheduleId, session.user.id);
  if (!isAdmin) throw new Error("Unauthorized");

  const parsed = z
    .object({
      name: requiredString.max(64),
      description: z.string().max(280).optional(),
      color: z
        .string()
        .regex(/^#?[0-9a-fA-F]{3,6}$/)
        .optional()
        .or(z.literal("")),
    })
    .safeParse({
      name: formData.get("name"),
      description: formData.get("description") ?? undefined,
      color: formData.get("color") ?? undefined,
    });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
  }

  const normalizedColor = parsed.data.color
    ? parsed.data.color.startsWith("#")
      ? parsed.data.color
      : `#${parsed.data.color}`
    : null;

  // Check for existing role in this schedule
  const existing = await db.role.findFirst({
    where: {
      scheduleId,
      name: parsed.data.name.trim(),
    },
  });

  if (existing) {
    await db.role.update({
      where: { id: existing.id },
      data: {
        description: parsed.data.description?.trim() || null,
        color: normalizedColor,
      },
    });
  } else {
    await db.role.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        color: normalizedColor,
        scheduleId,
        inviteToken: crypto.randomUUID(),
      },
    });
  }

  revalidatePath(`/schedules/${scheduleId}/roles`);
}

export async function regenerateRoleInviteTokenAction(roleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { id: true, scheduleId: true },
  });
  if (!role) throw new Error("Role not found");

  if (role.scheduleId) {
    const isAdmin = await isScheduleAdmin(role.scheduleId, session.user.id);
    if (!isAdmin) throw new Error("Unauthorized");
  }

  await db.role.update({
    where: { id: roleId },
    data: {
      inviteToken: crypto.randomUUID(),
    },
  });

  if (role.scheduleId) {
    revalidatePath(`/schedules/${role.scheduleId}/roles`);
  }
}

export async function addUserToRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const email = formData.get("email") as string;
  const roleId = formData.get("roleId") as string;
  const type = (formData.get("type") as string) || "required";

  if (!email || !roleId) throw new Error("Missing fields");

  // Fetch role to get scheduleId for revalidation and permission check
  const role = await db.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      scheduleId: true,
      schedule: { select: { name: true } },
    },
  });
  if (!role) throw new Error("Role not found");

  // Check admin permission
  if (role.scheduleId) {
    const isAdmin = await isScheduleAdmin(role.scheduleId, session.user.id);
    if (!isAdmin) throw new Error("Unauthorized");
  }

  let user = await db.user.findUnique({ where: { email } });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: email.split("@")[0],
      },
    });
  }

  let added = false;
  try {
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId,
        type,
      },
    });
    added = true;
  } catch (error) {
    // Ignore if already exists (unique constraint)
  }

  if (added && user.emailRoleAdded !== false) {
    // First role + login status decide how much explaining the email does.
    const [priorRoles, logins] = await Promise.all([
      db.userRole.count({ where: { userId: user.id, NOT: { roleId } } }),
      db.account.count({ where: { userId: user.id, provider: "keycloak" } }),
    ]);
    await sendRoleAddedEmail({
      email,
      name: user.name,
      roleName: role.name,
      scheduleName: role.schedule?.name ?? null,
      firstRole: priorRoles === 0,
      hasLogin: logins > 0,
    });
  }

  if (role.scheduleId) {
    revalidatePath(`/schedules/${role.scheduleId}/roles`);
  } else {
    revalidatePath("/roles"); // Fallback for legacy global roles
  }
}

export async function removeUserFromRoleAction(userId: string, roleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { id: true, scheduleId: true },
  });
  if (!role) throw new Error("Role not found");

  // Check admin permission
  if (role.scheduleId) {
    const isAdmin = await isScheduleAdmin(role.scheduleId, session.user.id);
    if (!isAdmin) throw new Error("Unauthorized");
  }

  await db.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (role.scheduleId) {
    revalidatePath(`/schedules/${role.scheduleId}/roles`);
  } else {
    revalidatePath("/roles");
  }
}

export async function updateRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const roleId = formData.get("roleId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!roleId || !name) throw new Error("Missing fields");

  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { id: true, scheduleId: true },
  });
  if (!role) throw new Error("Role not found");

  // Check admin permission
  if (role.scheduleId) {
    const isAdmin = await isScheduleAdmin(role.scheduleId, session.user.id);
    if (!isAdmin) throw new Error("Unauthorized");
  }

  const normalizedColor = color
    ? color.startsWith("#")
      ? color
      : `#${color}`
    : null;

  await db.role.update({
    where: { id: roleId },
    data: {
      name: name.trim(),
      color: normalizedColor,
    },
  });

  if (role.scheduleId) {
    revalidatePath(`/schedules/${role.scheduleId}/roles`);
  } else {
    revalidatePath("/roles");
  }
}

export async function joinRoleViaInviteAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const role = await db.role.findUnique({
    where: { inviteToken: token },
    include: { schedule: true },
  });

  if (!role) throw new Error("Invalid invite link");

  // Add user to role
  try {
    await db.userRole.create({
      data: {
        userId: session.user.id,
        roleId: role.id,
        type: "required",
      },
    });
  } catch (error) {
    // Ignore if already exists
  }

  if (role.scheduleId) {
    redirect(`/schedules/${role.scheduleId}`);
  } else {
    redirect("/");
  }
}

