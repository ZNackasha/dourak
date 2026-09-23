import "server-only";

import type { TokenSet, IdTokenClaims } from "openid-client";
import { db } from "@/lib/prisma";
import { createEmailTransport, emailFrom } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";

/**
 * Upsert the application `User` (and a linked `keycloak` `Account`) from a
 * Keycloak OIDC login. Keycloak is the identity provider; the user's `sub`
 * uniquely identifies them, and we fall back to email linking.
 */
export async function upsertUserFromKeycloak(
  claims: IdTokenClaims,
  tokenSet: TokenSet,
): Promise<{ id: string; phone: string | null }> {
  const sub = claims.sub;
  const email = (claims.email as string | undefined) ?? null;
  const emailVerified = claims.email_verified === true;
  const name =
    (claims.name as string | undefined) ??
    (claims.preferred_username as string | undefined) ??
    null;
  const image = (claims.picture as string | undefined) ?? null;

  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "keycloak",
        providerAccountId: sub,
      },
    },
    include: { user: true },
  });

  let user = existingAccount?.user ?? null;

  // The verified email is the identity of record. If another row already owns
  // it, adopt that row: the account may have been created before claims were
  // available, leaving a placeholder whose update would hit the unique index.
  if (email && emailVerified) {
    const emailOwner = await db.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== user?.id) {
      user = emailOwner;
    }
  }

  let isNewUser = false;
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name,
        image,
        emailVerified: emailVerified ? new Date() : null,
      },
    });
    isNewUser = true;
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        name: name ?? user.name,
        image: image ?? user.image,
        email: email ?? user.email,
        emailVerified:
          user.emailVerified ?? (emailVerified ? new Date() : null),
      },
    });
  }

  const accountData = {
    type: "oidc",
    access_token: tokenSet.access_token ?? null,
    id_token: tokenSet.id_token ?? null,
    refresh_token: tokenSet.refresh_token ?? null,
    expires_at: tokenSet.expires_at ?? null,
    scope: tokenSet.scope ?? null,
    token_type: tokenSet.token_type ?? null,
  };

  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "keycloak",
        providerAccountId: sub,
      },
    },
    create: {
      userId: user.id,
      provider: "keycloak",
      providerAccountId: sub,
      ...accountData,
    },
    update: { ...accountData, userId: user.id },
  });

  if (isNewUser && user.email) {
    await sendWelcomeEmail(user.email, user.name);
  }

  return { id: user.id, phone: user.phone };
}

/** One-time welcome email on a user's first login. Never blocks the login. */
async function sendWelcomeEmail(email: string, name: string | null) {
  const site = getSiteUrl();
  const greeting = name ? `Hi ${name},` : "Hi,";

  const text = `${greeting}

Welcome to Dourak — your account is ready!

Dourak is where your team organizes who serves at which events:
- Organizers set up schedules and the roles that need filling.
- When sign-ups open, you pick the dates that work for you.
- Once the organizer confirms you, you're on the schedule.

See your schedules: ${site}/schedules

Thanks,
Dourak

—
Manage which emails you receive: ${site}/settings`;

  try {
    await createEmailTransport().sendMail({
      from: emailFrom(),
      to: email,
      subject: "Welcome to Dourak",
      text,
    });

    if (!process.env.EMAIL_SERVER) {
      console.log("----------------------------------------------");
      console.log(`Welcome email to ${email}:`);
      console.log(text);
      console.log("----------------------------------------------");
    }
  } catch (e) {
    console.error(`Failed to send welcome email to ${email}`, e);
  }
}

/** Store/refresh the Google calendar tokens for an already-authenticated user. */
export async function storeGoogleCalendarAccount(
  userId: string,
  claims: IdTokenClaims,
  tokenSet: TokenSet,
): Promise<void> {
  const googleSub = claims.sub;

  const accountData = {
    type: "oauth",
    access_token: tokenSet.access_token ?? null,
    id_token: tokenSet.id_token ?? null,
    // Google only returns a refresh_token on the first consent (prompt=consent
    // guarantees one); never overwrite an existing one with null.
    ...(tokenSet.refresh_token
      ? { refresh_token: tokenSet.refresh_token }
      : {}),
    expires_at: tokenSet.expires_at ?? null,
    scope: tokenSet.scope ?? null,
    token_type: tokenSet.token_type ?? null,
  };

  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: googleSub,
      },
    },
    create: {
      userId,
      provider: "google",
      providerAccountId: googleSub,
      ...accountData,
    },
    update: {
      userId,
      ...accountData,
    },
  });
}

