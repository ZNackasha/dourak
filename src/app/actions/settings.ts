"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type EmailPreferenceKind =
  | "emailRecruitment"
  | "emailSchedule"
  | "emailRoleAdded";

const KINDS: EmailPreferenceKind[] = [
  "emailRecruitment",
  "emailSchedule",
  "emailRoleAdded",
];

export async function updateEmailPreferenceAction(
  kind: EmailPreferenceKind,
  enabled: boolean,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!KINDS.includes(kind)) throw new Error("Unknown preference");

  await db.user.update({
    where: { id: session.user.id },
    data: { [kind]: enabled },
  });

  revalidatePath("/settings");
}

