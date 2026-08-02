"use server";

import { redirect } from "next/navigation";

/**
 * Kick off the lazy, admin-only Google Calendar linking flow. This does not log
 * the user in (Keycloak handles that) — it attaches Google calendar tokens to
 * the current account. See /api/auth/google/connect.
 */
export async function connectGoogleCalendarAction() {
  redirect("/api/auth/google/connect");
}

export async function reconnectGoogleCalendarAction(formData: FormData) {
  const callbackUrl =
    (formData.get("callbackUrl") as string) || "/schedules/new";
  redirect(
    `/api/auth/google/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  );
}

