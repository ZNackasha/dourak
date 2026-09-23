import { NextRequest, NextResponse } from "next/server";
import {
  getKeycloakClient,
  appUrl,
  KEYCLOAK_CALLBACK_PATH,
  safeCallbackUrl,
} from "@/lib/auth/oidc";
import { upsertUserFromKeycloak } from "@/lib/auth/users";
import { createUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const TRANSIENT = ["kc_verifier", "kc_state", "kc_nonce", "kc_callback"];

export async function GET(req: NextRequest) {
  const codeVerifier = req.cookies.get("kc_verifier")?.value;
  const state = req.cookies.get("kc_state")?.value;
  const nonce = req.cookies.get("kc_nonce")?.value;
  const callbackUrl = safeCallbackUrl(req.cookies.get("kc_callback")?.value);

  const failure = () =>
    NextResponse.redirect(new URL("/login?error=callback", req.url));

  if (!codeVerifier || !state || !nonce) {
    return failure();
  }

  try {
    const client = await getKeycloakClient();
    const params = client.callbackParams(req.url);
    const tokenSet = await client.callback(
      `${appUrl()}${KEYCLOAK_CALLBACK_PATH}`,
      params,
      { code_verifier: codeVerifier, state, nonce },
    );

    const claims = tokenSet.claims();

    // userinfo fills in any profile claims left out of the id_token.
    let profile = claims;
    try {
      const userinfo = await client.userinfo(tokenSet);
      profile = { ...claims, ...userinfo };
    } catch (err) {
      console.error("Keycloak userinfo failed, using id_token claims", err);
    }

    const user = await upsertUserFromKeycloak(profile, tokenSet);
    await createUserSession(user.id);

    const destination = user.phone
      ? callbackUrl
      : `/onboarding/phone?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    const res = NextResponse.redirect(new URL(destination, appUrl()));
    for (const name of TRANSIENT) res.cookies.delete(name);
    return res;
  } catch (err) {
    console.error("Keycloak callback error", err);
    return failure();
  }
}
