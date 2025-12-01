import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/prisma";

// @ts-ignore
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // @ts-ignore
    signIn: async ({ user, account, profile }) => {
      if (account && user) {
        try {
          const existingAccount = await db.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (existingAccount) {
            const dataToUpdate: any = {
              access_token: account.access_token,
              expires_at: account.expires_at,
              scope: account.scope,
              token_type: account.token_type,
              id_token: account.id_token,
            };

            // Only update refresh_token if we got a new one
            if (account.refresh_token) {
              dataToUpdate.refresh_token = account.refresh_token;
            }

            await db.account.update({
              where: { id: existingAccount.id },
              data: dataToUpdate,
            });
          }
        } catch (e) {
          console.error("Error updating account on sign in", e);
        }
      }
      return true;
    },
    // @ts-ignore
    session: async ({ session, user }) => {
      if (session.user) {
        // @ts-ignore
        session.user.id = user.id;
      } else {
        session.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        } as any;
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;

