"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const requiredString = z.string().min(1, "This field is required");

export async function createRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

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

  await db.role.upsert({
    where: { name: parsed.data.name.trim() },
    update: {
      description: parsed.data.description?.trim() || null,
      color: normalizedColor,
    },
    create: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim(),
      color: normalizedColor,
    },
  });

  revalidatePath("/roles");
}

export async function addUserToRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const email = formData.get("email") as string;
  const roleId = formData.get("roleId") as string;
  const type = (formData.get("type") as string) || "required";

  if (!email || !roleId) throw new Error("Missing fields");

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

  revalidatePath("/roles");
}

export async function removeUserFromRoleAction(userId: string, roleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  revalidatePath("/roles");
}

export async function updateRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const roleId = formData.get("roleId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!roleId || !name) throw new Error("Missing fields");

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

  revalidatePath("/roles");
}

