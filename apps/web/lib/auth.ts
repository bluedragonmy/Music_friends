import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions, type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    hasSpotifyLinked: boolean;
  }
}
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),

    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: "https://accounts.spotify.com/authorize?scope=user-read-email,user-top-read,user-read-private,streaming,user-modify-playback-state,user-read-playback-state,user-read-currently-playing,user-read-recently-played",
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      id: "test-login",
      name: "測試帳號登入",
      credentials: {
        email: { label: "請輸入任意測試 Email", type: "email", placeholder: "test@vibe.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
            },
          });
        }
        return { id: user.id, email: user.email, name: user.name };
      }
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        
        // 檢查該用戶是否已綁定 Spotify
        const spotifyAccount = await prisma.account.findFirst({
          where: { userId: session.user.id, provider: "spotify" },
        });
        
        session.hasSpotifyLinked = !!spotifyAccount;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (account && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: dbUser.id,
                provider: account.provider,
              },
            });

            if (existingAccount) {
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  scope: account.scope,
                },
              });
              console.log(`⚡ [NextAuth Callback]: Successfully updated ${account.provider} tokens in DB for user: ${user.email}`);
            }
          }
        } catch (error) {
          console.error(`❌ [NextAuth Callback Error]: Failed to update ${account.provider} tokens:`, error);
        }
      }
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};