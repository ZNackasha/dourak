import "server-only";

import { Issuer, generators, type Client } from "openid-client";

/**
 * OIDC client factories (openid-client v5) for:
 *  - Zitadel: primary login / identity provider (Google login is brokered here).
 *  - Google:   admin-only calendar linkage (lazy). Not used for login.
 *
 * Discovery results are memoized per server process.
 */

export function appUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Only allow internal, same-origin redirect targets to avoid open redirects.
 * Anything that isn't a plain "/path" falls back to /schedules.
 */
export { safeCallbackUrl } from "@/lib/auth/callback-url";

/** Options for the short-lived cookies that carry OAuth state/PKCE. */
export const transientCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10, // 10 minutes
};

export const ZITADEL_CALLBACK_PATH = "/api/auth/zitadel/callback";
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export const GOOGLE_CALENDAR_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar.readonly";

let zitadelClient: Promise<Client> | null = null;
let googleClient: Promise<Client> | null = null;

export function getZitadelClient(): Promise<Client> {
  if (!zitadelClient) {
    zitadelClient = (async () => {
      const issuerUrl = process.env.ZITADEL_ISSUER;
      const clientId = process.env.ZITADEL_CLIENT_ID;
      const clientSecret = process.env.ZITADEL_CLIENT_SECRET;
      if (!issuerUrl) throw new Error("ZITADEL_ISSUER is not set");
      if (!clientId || !clientSecret) {
        throw new Error(
          "ZITADEL_CLIENT_ID / ZITADEL_CLIENT_SECRET are not set",
        );
      }
      const issuer = await Issuer.discover(issuerUrl);
      return new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        token_endpoint_auth_method: "client_secret_basic",
        redirect_uris: [`${appUrl()}${ZITADEL_CALLBACK_PATH}`],
        response_types: ["code"],
      });
    })().catch((err) => {
      zitadelClient = null;
      throw err;
    });
  }
  return zitadelClient;
}

export function getGoogleClient(): Promise<Client> {
  if (!googleClient) {
    googleClient = (async () => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set");
      }
      const issuer = await Issuer.discover("https://accounts.google.com");
      return new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [`${appUrl()}${GOOGLE_CALLBACK_PATH}`],
        response_types: ["code"],
      });
    })().catch((err) => {
      googleClient = null;
      throw err;
    });
  }
  return googleClient;
}

export { generators };

