import "server-only";

import { Issuer, generators, type Client } from "openid-client";

/**
 * OIDC client factories (openid-client v5) for:
 *  - Keycloak: primary login / identity provider.
 *  - Google:   secondary, admin-only calendar linkage (lazy). Not used for login.
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
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/schedules";
}

/** Options for the short-lived cookies that carry OAuth state/PKCE. */
export const transientCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10, // 10 minutes
};

export const KEYCLOAK_CALLBACK_PATH = "/api/auth/keycloak/callback";
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export const GOOGLE_CALENDAR_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar.readonly";

let keycloakClient: Promise<Client> | null = null;
let googleClient: Promise<Client> | null = null;

export function getKeycloakClient(): Promise<Client> {
  if (!keycloakClient) {
    keycloakClient = (async () => {
      const issuerUrl = process.env.KEYCLOAK_ISSUER;
      if (!issuerUrl) throw new Error("KEYCLOAK_ISSUER is not set");
      const issuer = await Issuer.discover(issuerUrl);
      return new issuer.Client({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        redirect_uris: [`${appUrl()}${KEYCLOAK_CALLBACK_PATH}`],
        response_types: ["code"],
      });
    })().catch((err) => {
      // Reset so a later request can retry discovery (e.g. Keycloak still booting).
      keycloakClient = null;
      throw err;
    });
  }
  return keycloakClient;
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
