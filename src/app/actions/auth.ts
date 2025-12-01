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
      prompt: "consent",
      access_type: "offline",
    }
  );
}

