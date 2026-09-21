import { NextRequest, NextResponse } from "next/server";
import {
  getZitadelClient,
  appUrl,
  ZITADEL_CALLBACK_PATH,
  safeCallbackUrl,
} from "@/lib/auth/oidc";
import { upsertUserFromZitadel } from "@/lib/auth/users";
import { createUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const TRANSIENT = ["zt_verifier", "zt_state", "zt_nonce", "zt_callback"];

export async function GET(req: NextRequest) {
  const codeVerifier = req.cookies.get("zt_verifier")?.value;
  const state = req.cookies.get("zt_state")?.value;
  const nonce = req.cookies.get("zt_nonce")?.value;
  const callbackUrl = safeCallbackUrl(req.cookies.get("zt_callback")?.value);

  const failure = () =>
    NextResponse.redirect(new URL("/login?error=callback", req.url));

  if (!codeVerifier || !state || !nonce) {
    return failure();
  }

  try {
    const client = await getZitadelClient();
    const params = client.callbackParams(req.url);
    const tokenSet = await client.callback(
      `${appUrl()}${ZITADEL_CALLBACK_PATH}`,
      params,
      { code_verifier: codeVerifier, state, nonce },
    );

    const claims = tokenSet.claims();

    // Zitadel omits profile/email claims from the id_token whenever an access
    // token is issued, so the userinfo endpoint is the reliable source.
    let profile = claims;
    try {
      const userinfo = await client.userinfo(tokenSet);
      profile = { ...claims, ...userinfo };
    } catch (err) {
      console.error("Zitadel userinfo failed, using id_token claims", err);
    }

    const user = await upsertUserFromZitadel(profile, tokenSet);
    await createUserSession(user.id);

    const destination = user.phone
      ? callbackUrl
      : `/onboarding/phone?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    const res = NextResponse.redirect(new URL(destination, appUrl()));
    for (const name of TRANSIENT) res.cookies.delete(name);
    return res;
  } catch (err) {
    console.error("Zitadel callback error", err);
    return failure();
  }
}
