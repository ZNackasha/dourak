import "server-only";

import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";

/**
 * Custom, database-backed session layer (replaces NextAuth).
 *
 * A random opaque session token is stored in an httpOnly cookie. Only the
 * SHA-256 hash of that token is persisted in the `Session` table, so a database
 * leak does not expose usable session tokens.
 */

export const SESSION_COOKIE = "dourak_session";
const SESSION_TTL_DAYS = 30;

function isSessionSchemaDriftError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;

  // P2021: table does not exist; P2022: column does not exist.
  return error.code === "P2021" || error.code === "P2022";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/** Create a new session for a user and set the session cookie. */
export async function createUserSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      sessionToken: hashToken(token),
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Resolve the current session user from the cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let session: Prisma.SessionGetPayload<{ include: { user: true } }> | null;
  try {
    session = await db.session.findUnique({
      where: { sessionToken: hashToken(token) },
      include: { user: true },
    });
  } catch (error) {
    if (isSessionSchemaDriftError(error)) {
      return null;
    }

    throw error;
  }

  if (!session) return null;

  if (session.expires < new Date()) {
    // Expired — clean it up.
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}

/** Destroy the current session (DB row + cookie). Returns the id_token if any. */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session
      .deleteMany({ where: { sessionToken: hashToken(token) } })
      .catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE);
}

