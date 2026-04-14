import { prisma } from "@/lib/prisma";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

function getProviderUsername(
  provider: "github" | "google",
  profile: Record<string, unknown> | undefined,
  fallbackEmail: string,
): string {
  if (provider === "github") {
    const login = profile?.login;
    if (typeof login === "string" && login.trim()) {
      return login.trim();
    }
  }

  if (provider === "google") {
    const name = profile?.name;
    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return fallbackEmail.split("@")[0] ?? "user";
}

async function hydrateTokenUserId(token: JWT): Promise<JWT> {
  if (token.userId || !token.email) {
    return token;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: token.email },
    select: { id: true },
  });

  if (dbUser) {
    token.userId = dbUser.id;
  }

  return token;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) {
        return false;
      }

      if (account.provider !== "github" && account.provider !== "google") {
        return false;
      }

      const providerField = account.provider === "github" ? "github_id" : "google_id";
      const providerId = account.providerAccountId;
      if (!providerId) {
        return false;
      }

      const username = getProviderUsername(account.provider, profile as Record<string, unknown> | undefined, user.email);
      const providerLookupWhere =
        account.provider === "github" ? { github_id: providerId } : { google_id: providerId };

      let dbUser = await prisma.user.findFirst({
        where: providerLookupWhere,
      });

      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
      }

      if (dbUser) {
        const nextData: {
          username?: string;
          github_id?: string;
          google_id?: string;
        } = {};

        if (!dbUser.github_id && !dbUser.google_id) {
          nextData[providerField] = providerId;
        } else if (!dbUser[providerField]) {
          nextData[providerField] = providerId;
        }

        if (username && dbUser.username !== username) {
          nextData.username = username;
        }

        if (Object.keys(nextData).length > 0) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: nextData,
          });
        }

        user.id = dbUser.id;
        return true;
      }

      const createdUser = await prisma.user.create({
        data: {
          username,
          email: user.email,
          github_id: account.provider === "github" ? providerId : null,
          google_id: account.provider === "google" ? providerId : null,
        },
      });

      user.id = createdUser.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        return token;
      }

      return hydrateTokenUserId(token);
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}
