import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export type Session = { user: SessionUser } | null;

/**
 * Returns the current session (or null). The shape is kept compatible with the
 * previous NextAuth `auth()` so existing call sites (`session?.user?.id`, etc.)
 * keep working. Authentication now runs through Keycloak via the route handlers
 * under /api/auth/keycloak/*; see src/lib/auth/*.
 */
export async function auth(): Promise<Session> {
  const user = await getSessionUser();
  return user ? { user } : null;
}
