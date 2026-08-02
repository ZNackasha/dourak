import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleClient,
  generators,
  safeCallbackUrl,
  transientCookieOptions,
  GOOGLE_CALENDAR_SCOPE,
} from "@/lib/auth/oidc";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Admin-only, lazy Google Calendar linkage. Requires an existing (Keycloak)
 * session — this does NOT log the user in, it only attaches Google calendar
 * tokens to the already-authenticated account.
 */
export async function GET(req: NextRequest) {
  const callbackUrl = safeCallbackUrl(
    req.nextUrl.searchParams.get("callbackUrl"),
  );

  const user = await getSessionUser();
  if (!user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", `/api/auth/google/connect`);
    return NextResponse.redirect(login);
  }

  let client;
  try {
    client = await getGoogleClient();
  } catch (err) {
    console.error("Google discovery failed", err);
    return NextResponse.redirect(new URL(callbackUrl, req.url));
  }

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();

  const authUrl = client.authorizationUrl({
    scope: GOOGLE_CALENDAR_SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("g_verifier", codeVerifier, transientCookieOptions);
  res.cookies.set("g_state", state, transientCookieOptions);
  res.cookies.set("g_callback", callbackUrl, transientCookieOptions);
  return res;
}
