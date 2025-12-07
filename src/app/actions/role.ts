"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isScheduleAdmin } from "@/lib/permissions";

const requiredString = z.string().min(1, "This field is required");

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
      type: z.enum(["required", "optional"]).default("required"),
      description: z.string().max(280).optional(),
      color: z
        .string()
        .regex(/^#?[0-9a-fA-F]{3,6}$/)
        .optional()
        .or(z.literal("")),
    })
    .safeParse({
      name: formData.get("name"),
      type: formData.get("type") ?? "required",
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
        type: parsed.data.type,
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
    select: { id: true, scheduleId: true },
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

  try {
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId,
        type,
      },
    });
  } catch (error) {
    // Ignore if already exists (unique constraint)
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
  const type = (formData.get("type") as string) || "required";
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
      type,
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
        type: role.type, // Use role's default type
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

