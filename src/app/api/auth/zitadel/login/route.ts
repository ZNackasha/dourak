import { NextRequest, NextResponse } from "next/server";
import {
  getZitadelClient,
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
    client = await getZitadelClient();
  } catch (err) {
    console.error("Zitadel discovery failed", err);
    return NextResponse.redirect(new URL("/login?error=zitadel", req.url));
  }

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();
  const nonce = generators.nonce();

  const authUrl = client.authorizationUrl({
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("zt_verifier", codeVerifier, transientCookieOptions);
  res.cookies.set("zt_state", state, transientCookieOptions);
  res.cookies.set("zt_nonce", nonce, transientCookieOptions);
  res.cookies.set("zt_callback", callbackUrl, transientCookieOptions);
  return res;
}