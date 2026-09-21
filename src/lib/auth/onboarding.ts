import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";

/**
 * Gate for authenticated pages: sends users to sign-in, then to phone capture,
 * until a phone number is on file. Returns the user id once satisfied.
 */
export async function requirePhone(returnTo: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  if (!user?.phone) {
    redirect(`/onboarding/phone?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  return session.user.id;
}
