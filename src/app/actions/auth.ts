"use server";

import { signIn } from "@/auth";

export async function connectGoogleCalendarAction() {
  await signIn(
    "google",
    {
      redirectTo: "/schedules/new",
    },
    {
      scope:
        "openid email profile https://www.googleapis.com/auth/calendar.readonly",
      prompt: "consent select_account",
      access_type: "offline",
      include_granted_scopes: "true",
    },
  );
}

export async function reconnectGoogleCalendarAction(formData: FormData) {
  const callbackUrl =
    (formData.get("callbackUrl") as string) || "/schedules/new";

  await signIn(
    "google",
    {
      redirectTo: callbackUrl,
    },
    {
      scope:
        "openid email profile https://www.googleapis.com/auth/calendar.readonly",
      prompt: "consent select_account",
      access_type: "offline",
      include_granted_scopes: "true",
    },
  );
}

