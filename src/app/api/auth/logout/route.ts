import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, destroyCurrentSession } from "@/lib/auth/session";
import { getKeycloakClient, appUrl } from "@/lib/auth/oidc";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const user = await getSessionUser();

  let idToken: string | null = null;
  if (user) {
    const account = await db.account.findFirst({
      where: { userId: user.id, provider: "keycloak" },
      select: { id_token: true },
    });
    idToken = account?.id_token ?? null;
  }

  await destroyCurrentSession();

  const home = new URL("/", appUrl());
  try {
    const client = await getKeycloakClient();
    const endSessionUrl = client.endSessionUrl({
      id_token_hint: idToken ?? undefined,
      post_logout_redirect_uri: `${appUrl()}/`,
    });
    return NextResponse.redirect(endSessionUrl);
  } catch (err) {
    console.error("Keycloak end-session failed, clearing local session only", err);
    return NextResponse.redirect(home);
  }
}

export const GET = handle;
export const POST = handle;
