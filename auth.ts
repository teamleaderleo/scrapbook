import NextAuth from 'next-auth';
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from './auth.config';
import { sql } from '@vercel/postgres';
import { z } from 'zod';
import type { Account } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from './app/lib/db/db';
import { accounts } from './app/lib//db/schema';

async function getUser(email: string): Promise<Account | undefined> {
  try {
    const users = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
    const user = users[0];
    
    if (!user) return undefined;

    // Map the database result to your Account type
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password ?? undefined,
      provider: user.provider ?? undefined,
      providerAccountId: user.providerAccountId ?? undefined,
      lastLogin: user.lastLogin ?? undefined
    };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password || '');
          if (passwordsMatch) return user;
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const email = user.email;
        if (!email) {
          console.error('User email is missing');
          return false;
        }

        const existingUser = await getUser(email);
        if (existingUser) {
          // User exists, update last login
          await db.update(accounts)
            .set({
              lastLogin: new Date(),
              provider: account.provider,
              providerAccountId: account.providerAccountId
            })
            .where(eq(accounts.email, email));
        } else {
          // New user, create account
          await db.insert(accounts).values({
            id: user.id ?? crypto.randomUUID(), // Use provided id or generate a new one
            name: user.name ?? 'Unknown',
            email: email,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            lastLogin: new Date()
          });
        }
      }
      return true;
    },
  },
});