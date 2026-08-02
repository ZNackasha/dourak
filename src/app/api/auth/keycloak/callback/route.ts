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
    const user = await upsertUserFromKeycloak(claims, tokenSet);
    await createUserSession(user.id);

    const res = NextResponse.redirect(new URL(callbackUrl, appUrl()));
    for (const name of TRANSIENT) res.cookies.delete(name);
    return res;
  } catch (err) {
    console.error("Keycloak callback error", err);
    return failure();
  }
}

