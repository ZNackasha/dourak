import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleClient,
  appUrl,
  GOOGLE_CALLBACK_PATH,
  safeCallbackUrl,
} from "@/lib/auth/oidc";
import { getSessionUser } from "@/lib/auth/session";
import { storeGoogleCalendarAccount } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

const TRANSIENT = ["g_verifier", "g_state", "g_callback"];

export async function GET(req: NextRequest) {
  const callbackUrl = safeCallbackUrl(req.cookies.get("g_callback")?.value);
  const codeVerifier = req.cookies.get("g_verifier")?.value;
  const state = req.cookies.get("g_state")?.value;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const back = (ok: boolean) => {
    const url = new URL(callbackUrl, appUrl());
    if (!ok) url.searchParams.set("calendarError", "1");
    const res = NextResponse.redirect(url);
    for (const name of TRANSIENT) res.cookies.delete(name);
    return res;
  };

  if (!codeVerifier || !state) return back(false);

  try {
    const client = await getGoogleClient();
    const params = client.callbackParams(req.url);
    const tokenSet = await client.callback(
      `${appUrl()}${GOOGLE_CALLBACK_PATH}`,
      params,
      { code_verifier: codeVerifier, state },
    );

    const claims = tokenSet.claims();
    await storeGoogleCalendarAccount(user.id, claims, tokenSet);
    return back(true);
  } catch (err) {
    console.error("Google callback error", err);
    return back(false);
  }
}

