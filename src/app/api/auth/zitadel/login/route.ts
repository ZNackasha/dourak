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

  // Default to "login" so Zitadel shows the provider list (e.g. Google) instead
  // of its session chooser when the user already has a Zitadel session.
  const requestedPrompt = req.nextUrl.searchParams.get("prompt");
  const prompt =
    requestedPrompt === "select_account" || requestedPrompt === "none"
      ? requestedPrompt
      : "login";

  const scopes = ["openid", "email", "profile"];

  // With ZITADEL_IDP_ID set, Zitadel skips its own screen and hands the user
  // straight to that provider. `?chooser=1` opts out so username/password and
  // other providers stay reachable.
  const idpId = process.env.ZITADEL_IDP_ID?.trim();
  if (idpId && req.nextUrl.searchParams.get("chooser") !== "1") {
    if (/^\d+$/.test(idpId)) {
      scopes.push(`urn:zitadel:iam:org:idp:id:${idpId}`);
    } else {
      // A non-numeric value (e.g. a Google client id) breaks sign-in entirely,
      // so fall back to the normal Zitadel screen instead.
      console.error(
        "ZITADEL_IDP_ID must be the numeric Zitadel provider id; ignoring it",
      );
    }
  }

  const authUrl = client.authorizationUrl({
    scope: scopes.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    prompt,
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("zt_verifier", codeVerifier, transientCookieOptions);
  res.cookies.set("zt_state", state, transientCookieOptions);
  res.cookies.set("zt_nonce", nonce, transientCookieOptions);
  res.cookies.set("zt_callback", callbackUrl, transientCookieOptions);
  return res;
}

