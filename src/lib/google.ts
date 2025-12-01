import { db } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export async function getValidAccessToken(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("No Google account linked");
  }

  // Check if token is expired (expires_at is in seconds)
  // Give a 5 minute buffer
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now + 300) {
    return account.access_token;
  }

  // Token expired, refresh it
  if (!account.refresh_token) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    console.error("Error refreshing token", tokens);
    throw new Error("Failed to refresh token");
  }

  // Update account in DB
  const newExpiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

  await db.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      expires_at: newExpiresAt,
      refresh_token: tokens.refresh_token ?? account.refresh_token, // Sometimes Google doesn't return a new refresh token
    },
  });

  return tokens.access_token;
}

export async function listCalendars(userId: string) {
  const accessToken = await getValidAccessToken(userId);

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const json = JSON.parse(errorText);
      errorMessage = json.error?.message || json.error_description || errorText;
    } catch {
      // ignore JSON parse error
    }
    console.error("Google Calendar API Error:", response.status, errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.items; // Array of calendars
}

export async function listEvents(
  userId: string,
  calendarId: string,
  start: Date,
  end: Date
) {
  const accessToken = await getValidAccessToken(userId);

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await response.json();
  return data.items;
}

