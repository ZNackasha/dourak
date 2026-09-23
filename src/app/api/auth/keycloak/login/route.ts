import { NextRequest, NextResponse } from "next/server";
import {
  getKeycloakClient,
  generators,
  safeCallbackUrl,
  transientCookieOptions,
} from "@/lib/auth/oidc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const callbackUrl = safeCallbackUrl(
    req.nextUrl.searchParams.get("callbackUrl"),
  );

  let client;
  try {
    client = await getKeycloakClient();
  } catch (err) {
    console.error("Keycloak discovery failed", err);
    return NextResponse.redirect(new URL("/login?error=keycloak", req.url));
  }

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();
  const nonce = generators.nonce();

  // KEYCLOAK_IDP_HINT (an IdP alias such as "google") skips Keycloak's login
  // page. `?chooser=1` opts out so the password form stays reachable.
  const idpHint = process.env.KEYCLOAK_IDP_HINT?.trim();
  const useHint =
    idpHint &&
    /^[A-Za-z0-9_-]+$/.test(idpHint) &&
    req.nextUrl.searchParams.get("chooser") !== "1";

  const authUrl = client.authorizationUrl({
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    ...(useHint ? { kc_idp_hint: idpHint } : {}),
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("kc_verifier", codeVerifier, transientCookieOptions);
  res.cookies.set("kc_state", state, transientCookieOptions);
  res.cookies.set("kc_nonce", nonce, transientCookieOptions);
  res.cookies.set("kc_callback", callbackUrl, transientCookieOptions);
  return res;
}

